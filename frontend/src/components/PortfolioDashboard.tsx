import React, { useState } from 'react';
import { Box, Container, Typography, Paper, Button, ButtonGroup } from '@mui/material';
import Grid from '@mui/material/Grid';
import { PortfolioData, PerformanceData } from '../types/portfolio';
import PortfolioTable from './PortfolioTable';
import PerformanceChart from './PerformanceChart';
import PortfolioComposition from './PortfolioComposition';

interface PortfolioDashboardProps {
    portfolioData: PortfolioData;
    performanceData: PerformanceData;
}

const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolioData, performanceData }) => {
    const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('ALL');

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
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
                        <ButtonGroup variant="contained" aria-label="time range selector">
                            <Button onClick={() => setTimeRange('1M')} variant={timeRange === '1M' ? 'contained' : 'outlined'}>
                                1 Month
                            </Button>
                            <Button onClick={() => setTimeRange('3M')} variant={timeRange === '3M' ? 'contained' : 'outlined'}>
                                3 Months
                            </Button>
                            <Button onClick={() => setTimeRange('6M')} variant={timeRange === '6M' ? 'contained' : 'outlined'}>
                                6 Months
                            </Button>
                            <Button onClick={() => setTimeRange('1Y')} variant={timeRange === '1Y' ? 'contained' : 'outlined'}>
                                1 Year
                            </Button>
                            <Button onClick={() => setTimeRange('ALL')} variant={timeRange === 'ALL' ? 'contained' : 'outlined'}>
                                All Time
                            </Button>
                        </ButtonGroup>
                    </Paper>
                </Grid>

                {/* Performance Chart */}
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Performance
                        </Typography>
                        <PerformanceChart data={performanceData} timeRange={timeRange} />
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