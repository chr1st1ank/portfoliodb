import React, { useState, useMemo } from 'react';
import { Box, Container, Typography, Paper, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Grid from '@mui/material/Grid';
import { PortfolioData, PerformanceData } from '../types/portfolio';
import PortfolioTable from './PortfolioTable';
import PerformanceChart from './PerformanceChart';
import PortfolioComposition from './PortfolioComposition';

interface PortfolioDashboardProps {
    portfolioData: PortfolioData;
    performanceData: PerformanceData[];
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolioData, performanceData }) => {
    const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');
    const [endDate, setEndDate] = useState<Date | null>(null);

    // Get the last date from performance data
    const lastDataDate = useMemo(() => {
        if (performanceData.length === 0) return new Date();
        return new Date(Math.max(...performanceData.map(d => new Date(d.date).getTime())));
    }, [performanceData]);

    const dateRange = useMemo<DateRange>(() => {
        const endDateValue = endDate || lastDataDate;
        let startDate = new Date(endDateValue);

        switch (timeRange) {
            case '1M':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case '3M':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case '6M':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case '1Y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            case 'ALL':
                // Find the earliest date in the performance data
                startDate = new Date(Math.min(...performanceData.map(d => new Date(d.date).getTime())));
                break;
        }

        return { startDate, endDate: endDateValue };
    }, [timeRange, performanceData, endDate, lastDataDate]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const handleTimeRangeChange = (
        _: React.MouseEvent<HTMLElement>,
        newTimeRange: '1M' | '3M' | '6M' | '1Y' | 'ALL',
    ) => {
        if (newTimeRange !== null) {
            setTimeRange(newTimeRange);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Portfolio Overview
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Current Status ({portfolioData.currentDate})
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Total Value
                        </Typography>
                        <Typography variant="h4">
                            {formatCurrency(portfolioData.total.endValue)}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Total Return
                        </Typography>
                        <Typography variant="h4" color={portfolioData.total.return >= 0 ? 'success.main' : 'error.main'}>
                            {portfolioData.total.return.toFixed(2)}%
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Total Payments
                        </Typography>
                        <Typography variant="h4">
                            {formatCurrency(portfolioData.total.paymentSum)}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Balance
                        </Typography>
                        <Typography variant="h4" color={portfolioData.total.balance >= 0 ? 'success.main' : 'error.main'}>
                            {formatCurrency(portfolioData.total.balance)}
                        </Typography>
                    </Paper>
                </Grid>

                {/* Time Range Selector */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Time Range
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <ToggleButtonGroup
                                value={timeRange}
                                exclusive
                                onChange={handleTimeRangeChange}
                                aria-label="time range"
                            >
                                <ToggleButton value="1M">1M</ToggleButton>
                                <ToggleButton value="3M">3M</ToggleButton>
                                <ToggleButton value="6M">6M</ToggleButton>
                                <ToggleButton value="1Y">1Y</ToggleButton>
                                <ToggleButton value="ALL">ALL</ToggleButton>
                            </ToggleButtonGroup>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="End Date"
                                    value={endDate}
                                    onChange={(newValue: Date | null) => setEndDate(newValue)}
                                    maxDate={lastDataDate}
                                />
                            </LocalizationProvider>
                        </Box>
                    </Paper>
                </Grid>

                {/* Performance Chart */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Performance
                        </Typography>
                        <PerformanceChart data={performanceData} dateRange={dateRange} />
                    </Paper>
                </Grid>

                {/* Portfolio Composition */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Portfolio Composition
                        </Typography>
                        <PortfolioComposition data={portfolioData} />
                    </Paper>
                </Grid>

                {/* Portfolio Table */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Detailed Holdings
                        </Typography>
                        <PortfolioTable data={portfolioData} />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PortfolioDashboard; 