import React, { useState, useMemo } from 'react';
import { Box, Typography, Paper, ToggleButtonGroup, ToggleButton, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { PortfolioData, TimeRange } from '../types/portfolio';
import { Investment } from '../types/api';
import PortfolioTable from './PortfolioTable';
import PerformanceChart from './PerformanceChart';
import PortfolioComposition from './PortfolioComposition';
import { getDateRange } from '../utils/dateRange';

interface PortfolioDashboardProps {
    portfolioData: PortfolioData;
    onDateChange: (date: Date | null) => void;
    investments: Investment[];
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolioData, onDateChange, investments }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [, setAnchorEl] = useState<null | HTMLElement>(null);
    const [showPerformanceChart, setShowPerformanceChart] = useState(true);

    // Get the last date from developments data
    const lastDataDate = useMemo(() => {
        const dates = portfolioData.developments.map(d => new Date(d.date).getTime());
        return dates.length ? new Date(Math.max(...dates)) : new Date();
    }, [portfolioData.developments]);

    const dateRange = getDateRange(portfolioData.developments.map(d => d.date), timeRange, endDate);

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
        setEndDate(date || new Date());
        onDateChange(date || new Date());
        handleDateClose();
    };

    return (
        <>
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
                        <Grid container>
                            <Grid size={{ xs: 6, sm: 3 }}>
                                <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Gesamtwert
                                    </Typography>
                                    <Typography variant="h6">
                                        {formatCurrency(portfolioData.total.valueAfter)}
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
                                developments={portfolioData.developments}
                                dateRange={dateRange}
                                investments={investments}
                                totalsName='Gesamtportfolio'
                            />
                        ) : (
                            <PortfolioComposition data={portfolioData} />
                        )}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, maxHeight: '100vh', overflow: 'auto' }}>
                    <Typography variant="h6" gutterBottom>
                        Detaillierte Bestände
                    </Typography>
                    <PortfolioTable data={portfolioData} />
                </Paper>
            </Grid>
        </Grid >
        </>
    );
};

export default PortfolioDashboard;