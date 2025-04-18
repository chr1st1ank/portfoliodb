import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { PortfolioData, PerformanceData } from '../types/portfolio';
import { Investment, Development, Movement } from '../services/api';

// Utility functions for calculating derived values
const calculateInvestmentData = (
    investment: Investment,
    developments: Development[],
    movements: Movement[],
    targetDate: Date
) => {
    const investmentDevelopments = developments
        .filter((d: Development) => d.investment === investment.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find the development closest to but not after the target date
    const relevantDevelopment = investmentDevelopments
        .filter(d => new Date(d.date) <= targetDate)
        .pop() || investmentDevelopments[0];

    const quantity = parseFloat(relevantDevelopment?.quantity?.toString() || '0');
    const value = parseFloat(relevantDevelopment?.value?.toString() || '0');

    // Calculate payment sum from movements up to the target date
    const paymentSum = movements
        .filter(m => m.investment === investment.id && new Date(m.date) <= targetDate)
        .reduce((sum, movement) => {
            if (movement.action === 1) { // Only consider buy actions
                return sum + movement.amount + movement.fee;
            }
            return sum;
        }, 0);

    // Calculate balance and return
    const balance = value - paymentSum;
    const returnValue = paymentSum > 0 ? ((value - paymentSum) / paymentSum) * 100 : 0;

    return {
        id: investment.id,
        name: investment.name,
        isin: investment.isin,
        shortName: investment.short_name,
        paymentSum,
        quantityAfter: quantity,
        valueAfter: value,
        balance,
        endValue: value,
        return: returnValue,
    };
};

const calculatePerformanceData = (
    developments: Development[],
    investments: Investment[],
    targetDate: Date
): PerformanceData[] => {
    const developmentsByDate = developments
        .filter(d => new Date(d.date) <= targetDate)
        .reduce((acc: { [key: string]: Development[] }, dev: Development) => {
            if (!dev.date) return acc;
            const date = new Date(dev.date).getTime();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(dev);
            return acc;
        }, {});

    return Object.entries(developmentsByDate)
        .map(([date, devs]) => {
            const totalValue = devs.reduce((sum: number, dev: Development) => {
                const value = parseFloat(dev.value?.toString() || '0');
                return sum + (isNaN(value) ? 0 : value);
            }, 0);

            const performance: any = {
                date: new Date(parseInt(date)),
                value: totalValue,
            };

            devs.forEach((dev: Development) => {
                const investment = investments.find(inv => inv.id === dev.investment);
                if (investment) {
                    performance[investment.isin] = parseFloat(dev.value?.toString() || '0');
                }
            });

            return performance;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
};

const calculateTotals = (investments: any[]) => ({
    previousValue: investments.reduce((sum, inv) => sum + (inv.valueAfter - inv.balance), 0),
    paymentSum: investments.reduce((sum, inv) => sum + inv.paymentSum, 0),
    valueAfter: investments.reduce((sum, inv) => sum + inv.valueAfter, 0),
    balance: investments.reduce((sum, inv) => sum + inv.balance, 0),
    return: investments.reduce((sum, inv) => sum + inv.return, 0),
    endValue: investments.reduce((sum, inv) => sum + inv.endValue, 0)
});

export const usePortfolioData = (selectedDate?: Date) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rawData, setRawData] = useState<{
        investments: Investment[];
        developments: Development[];
        movements: Movement[];
    } | null>(null);

    // Fetch raw data only once
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [investmentsData, developmentsData, movementsData] = await Promise.all([
                    api.investments.getAll(),
                    api.developments.getAll(),
                    api.movements.getAll(),
                ]);

                setRawData({
                    investments: investmentsData,
                    developments: developmentsData,
                    movements: movementsData,
                });
            } catch (err) {
                console.error('Error in usePortfolioData:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate portfolio data based on raw data and selected date
    const portfolioData = useMemo<PortfolioData | null>(() => {
        if (!rawData) return null;

        const { investments, developments, movements } = rawData;
        const targetDate = selectedDate || new Date();

        // Get the latest date from developments
        const validDates = developments
            .map((d: Development) => d.date)
            .filter((date: string) => date && !isNaN(new Date(date).getTime()));

        if (validDates.length === 0) {
            throw new Error('No valid dates found in developments data');
        }

        const latestDate = new Date(Math.max(...validDates.map((date: string) => new Date(date).getTime())));

        // Transform investments data
        const transformedInvestments = investments.map(investment =>
            calculateInvestmentData(investment, developments, movements, targetDate)
        );

        // Calculate performance data
        const performanceData = calculatePerformanceData(developments, investments, targetDate);

        // Calculate totals
        const total = calculateTotals(transformedInvestments);

        return {
            investments: transformedInvestments,
            performance: performanceData,
            latestDate,
            currentDate: targetDate.toLocaleDateString('de-DE'),
            total,
        };
    }, [rawData, selectedDate]);

    return { portfolioData, loading, error };
}; 