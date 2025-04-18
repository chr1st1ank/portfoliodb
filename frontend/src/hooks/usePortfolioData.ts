import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { PortfolioData } from '../types/portfolio';
import { calculateInvestmentData, calculatePerformanceData, calculateTotals } from '../utils/portfolioTransformations';

export const usePortfolioData = (selectedDate?: Date) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rawData, setRawData] = useState<{
        investments: any[];
        developments: any[];
        movements: any[];
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
            .map((d: any) => d.date)
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

    return { portfolioData, loading, error, investments: rawData?.investments || [] };
}; 