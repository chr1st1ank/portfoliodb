import React, { useState, useMemo } from 'react';
import { Box, Container, Typography, Paper, ToggleButtonGroup, ToggleButton, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PortfolioData, PerformanceData, TimeRange } from '../types/portfolio';
import { Investment } from '../services/api';
import PortfolioTable from './PortfolioTable';
import PerformanceChart from './PerformanceChart';
import PortfolioComposition from './PortfolioComposition';

interface PortfolioDashboardProps {
    portfolioData: PortfolioData;
    performanceData: PerformanceData[];
    onDateChange: (date: Date | null) => void;
    investments: Investment[];
}

interface DateRange {
    startDate: Date;
    endDate: Date;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolioData, performanceData, onDateChange, investments }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showPerformanceChart, setShowPerformanceChart] = useState(true);

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
        newTimeRange: TimeRange,
    ) => {
        if (newTimeRange !== null) {
            setTimeRange(newTimeRange);
        }
    };


    const handleDateClose = () => {
        setAnchorEl(null);
    };

    const handleDateSelect = (date: Date | null) => {
        setEndDate(date);
        onDateChange(date);
        handleDateClose();
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5" component="h1">
                        Portfolio Übersicht
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {portfolioData.currentDate}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <ToggleButtonGroup
                        value={timeRange}
                        exclusive
                        onChange={handleTimeRangeChange}
                        aria-label="Zeitraum"
                        size="small"
                    >
                        <ToggleButton value="1M">1M</ToggleButton>
                        <ToggleButton value="3M">3M</ToggleButton>
                        <ToggleButton value="6M">6M</ToggleButton>
                        <ToggleButton value="1Y">1J</ToggleButton>
                        <ToggleButton value="ALL">Alle</ToggleButton>
                    </ToggleButtonGroup>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Enddatum"
                            value={endDate}
                            onChange={handleDateSelect}
                            maxDate={lastDataDate}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                    </LocalizationProvider>
                </Box>
            </Box>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 1 }}>
                        <Grid container spacing={1}>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Gesamtwert
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(portfolioData.total.endValue)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Gesamtrendite
                                    </Typography>
                                    <Typography variant="h6" color={portfolioData.total.return >= 0 ? 'success.main' : 'error.main'}>
                                        {portfolioData.total.return.toFixed(2)}%
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Gesamtzahlungen
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(portfolioData.total.paymentSum)}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Saldo
                                    </Typography>
                                    <Typography variant="h6" color={portfolioData.total.balance >= 0 ? 'success.main' : 'error.main'}>
                                        {formatCurrency(portfolioData.total.balance)}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }} sx={{ mb: 2 }}>
                    <Paper sx={{ p: 2, height: '500px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">
                                {showPerformanceChart ? 'Performance' : 'Portfolio-Zusammensetzung'}
                            </Typography>
                            <ToggleButtonGroup
                                value={showPerformanceChart}
                                exclusive
                                onChange={(_, newValue) => setShowPerformanceChart(newValue)}
                                aria-label="Diagrammtyp"
                                size="small"
                            >
                                <ToggleButton value={true}>Performance</ToggleButton>
                                <ToggleButton value={false}>Zusammensetzung</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>
                        {showPerformanceChart ? (
                            <PerformanceChart
                                data={performanceData}
                                dateRange={dateRange}
                                investments={investments}
                            />
                        ) : (
                            <PortfolioComposition data={portfolioData} />
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Detaillierte Bestände
                        </Typography>
                        <PortfolioTable data={portfolioData} />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default PortfolioDashboard; 