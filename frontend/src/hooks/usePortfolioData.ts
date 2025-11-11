import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { PortfolioData } from '../types/portfolio';
import { calculateInvestmentData, calculateInvestmentPerformance, calculateTotals } from '../utils/portfolioTransformations';

export const usePortfolioData = (selectedDate?: Date) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rawData, setRawData] = useState<{
        investments: any[];
        developments: any[];
        movements: any[];
    } | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // First, fetch movements to determine the earliest date we need
            const movementsData = await api.movements.getAll();
            
            // Find the earliest movement date
            let startDate: Date;
            if (movementsData.length > 0) {
                const movementDates = movementsData.map(m => new Date(m.date));
                const earliestMovement = new Date(Math.min(...movementDates.map(d => d.getTime())));
                startDate = earliestMovement;
            } else {
                // No movements yet, just fetch last year as fallback
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
            }
            
            const endDate = new Date();
            const dateParams = {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            };

            const [investmentsData, developmentsData] = await Promise.all([
                api.investments.getAll(),
                api.developments.getAll(dateParams),
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
    }, []);

    // Fetch raw data when component mounts or when refresh is triggered
    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    // Function to trigger a data refresh
    const refetch = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    // Calculate portfolio data based on raw data and selected date
    const portfolioData = useMemo<PortfolioData | null>(() => {
        if (!rawData) return null;
        
        // Add a console log to help with debugging
        console.log('Recalculating portfolio data', { refreshTrigger, selectedDate });

        const { investments, developments, movements } = rawData;
        const targetDate = selectedDate || new Date();

        // Get the latest date from developments
        const validDates = developments
            .map((d: any) => d.date)
            .filter((date: string) => date && !isNaN(new Date(date).getTime()));

        // Handle empty developments data gracefully
        if (validDates.length === 0) {
            // Return a minimal portfolio data structure when no data is available
            return {
                investments: [],
                performance: [],
                developments: [],
                movements: [],
                latestDate: new Date(),
                currentDate: targetDate.toLocaleDateString('de-DE'),
                total: {
                    previousValue: 0,
                    paymentSum: 0,
                    valueAfter: 0,
                    balance: 0,
                    return: 0
                },
            };
        }

        const latestDate = new Date(Math.max(...validDates.map((date: string) => new Date(date).getTime())));

        // Transform investments data
        const transformedInvestments = investments.map(investment =>
            calculateInvestmentData(investment, developments, movements, targetDate)
        );

        // Calculate performance data
        const InvestmentPerformance = calculateInvestmentPerformance(developments, investments, targetDate);

        // Calculate totals
        const total = calculateTotals(transformedInvestments);

        return {
            investments: transformedInvestments,
            performance: InvestmentPerformance,
            developments,
            movements,
            latestDate,
            currentDate: targetDate.toLocaleDateString('de-DE'),
            total,
        };
    }, [rawData, selectedDate, refreshTrigger]);

    return { portfolioData, loading, error, refetch };
};