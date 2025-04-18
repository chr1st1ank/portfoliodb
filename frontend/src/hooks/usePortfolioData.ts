import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PortfolioData, PerformanceData } from '../types/portfolio';
import { Investment, Development } from '../services/api';

export const usePortfolioData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [developments, setDevelopments] = useState<Development[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch investments and developments
                const [investmentsData, developmentsData] = await Promise.all([
                    api.investments.getAll(),
                    api.developments.getAll(),
                ]);

                console.log('Raw API Data:', { investmentsData, developmentsData });

                setInvestments(investmentsData);
                setDevelopments(developmentsData);

                // Get the latest date from developments
                const validDates = developmentsData
                    .map((d: Development) => d.date)
                    .filter((date: string) => date && !isNaN(new Date(date).getTime()));

                if (validDates.length === 0) {
                    throw new Error('No valid dates found in developments data');
                }

                const latestDate = new Date(Math.max(...validDates.map((date: string) => new Date(date).getTime())));

                // Transform investments data
                const transformedInvestments = investmentsData.map((investment: Investment) => {
                    const investmentDevelopments = developmentsData.filter((d: Development) => d.investment === investment.id);
                    const latestDevelopment = investmentDevelopments[investmentDevelopments.length - 1];

                    const quantity = parseFloat(latestDevelopment?.quantity?.toString() || '0');
                    const value = parseFloat(latestDevelopment?.value?.toString() || '0');

                    const transformed = {
                        id: investment.id,
                        name: investment.name,
                        isin: investment.isin,
                        shortName: investment.short_name,
                        paymentSum: 0, // TODO: Calculate from developments
                        quantityAfter: quantity,
                        valueAfter: value,
                        balance: 0, // TODO: Calculate from developments
                        endValue: value,
                        return: 0, // TODO: Calculate from developments
                    };

                    console.log('Transformed investment:', transformed);
                    return transformed;
                });

                // Group developments by date
                const developmentsByDate = developmentsData.reduce((acc: { [key: string]: Development[] }, dev: Development) => {
                    if (!dev.date) return acc;
                    const date = new Date(dev.date).getTime();
                    if (!acc[date]) {
                        acc[date] = [];
                    }
                    acc[date].push(dev);
                    return acc;
                }, {});

                // Calculate total value for each date
                const performanceData: PerformanceData[] = Object.entries(developmentsByDate)
                    .map(([date, devs]) => {
                        const totalValue = devs.reduce((sum: number, dev: Development) => {
                            const value = parseFloat(dev.value?.toString() || '0');
                            return sum + (isNaN(value) ? 0 : value);
                        }, 0);

                        // Create an object with the total value and individual asset values
                        const performance: any = {
                            date: new Date(parseInt(date)),
                            value: totalValue,
                        };

                        // Add individual asset values
                        devs.forEach((dev: Development) => {
                            const investment = investmentsData.find(inv => inv.id === dev.investment);
                            if (investment) {
                                performance[investment.isin] = parseFloat(dev.value?.toString() || '0');
                            }
                        });

                        console.log('Performance data point:', performance);
                        return performance;
                    })
                    .sort((a, b) => a.date.getTime() - b.date.getTime());

                const newPortfolioData: PortfolioData = {
                    investments: transformedInvestments,
                    performance: performanceData,
                    latestDate,
                    currentDate: latestDate.toLocaleDateString('de-DE'),
                    total: {
                        previousValue: transformedInvestments.reduce((sum, inv) => sum + (inv.valueAfter - inv.balance), 0),
                        paymentSum: transformedInvestments.reduce((sum, inv) => sum + inv.paymentSum, 0),
                        valueAfter: transformedInvestments.reduce((sum, inv) => sum + inv.valueAfter, 0),
                        balance: transformedInvestments.reduce((sum, inv) => sum + inv.balance, 0),
                        return: transformedInvestments.reduce((sum, inv) => sum + inv.return, 0),
                        endValue: transformedInvestments.reduce((sum, inv) => sum + inv.endValue, 0)
                    }
                };

                console.log('Final portfolio data:', newPortfolioData);
                setPortfolioData(newPortfolioData);
            } catch (err) {
                console.error('Error in usePortfolioData:', err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                throw err;
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    console.log('Hook return value:', { portfolioData, loading, error });
    return { portfolioData, loading, error };
}; 