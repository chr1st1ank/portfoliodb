import React, { useState } from 'react';
import { Box, Container, Typography, Paper, ToggleButtonGroup, ToggleButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { InvestmentData, TimeRange } from '../types/portfolio';
import PerformanceChart from './PerformanceChart';

interface Transaction {
    date: Date;
    type: 'Buy' | 'Sell';
    quantity: number;
    amount: number;
    fees: number;
    totalQuantity: number;
    totalValue: number;
}

interface InvestmentDetailProps {
    investment: InvestmentData;
    performanceData: { date: Date; value: number }[];
    transactions: Transaction[];
}

const InvestmentDetail: React.FC<InvestmentDetailProps> = ({ investment, performanceData, transactions }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
    const [endDate, setEndDate] = useState<Date | null>(null);

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

    const handleDateSelect = (date: Date | null) => {
        setEndDate(date);
    };

    const totalFees = transactions.reduce((sum, t) => sum + t.fees, 0);
    const totalPayments = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return (
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
            <Box sx={{ mb: 2 }}>
                <Typography variant="h4" component="h1">
                    {investment.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    ISIN: {investment.isin}
                </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Aktueller Wert
                                </Typography>
                                <Typography variant="h6">
                                    {formatCurrency(investment.valueAfter)}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Menge
                                </Typography>
                                <Typography variant="h6">
                                    {investment.quantityAfter}
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Rendite
                                </Typography>
                                <Typography variant="h6" color={investment.return >= 0 ? 'success.main' : 'error.main'}>
                                    {investment.return.toFixed(2)}%
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Saldo
                                </Typography>
                                <Typography variant="h6" color={investment.balance >= 0 ? 'success.main' : 'error.main'}>
                                    {formatCurrency(investment.balance)}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Wertentwicklung</Typography>
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
                                    slotProps={{ textField: { size: 'small' } }}
                                />
                            </LocalizationProvider>
                        </Box>
                    </Box>
                    <Box sx={{ height: 400 }}>
                        <PerformanceChart
                            data={performanceData}
                            dateRange={{
                                startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                                endDate: new Date()
                            }}
                            investments={[{ ...investment, shortname: investment.shortName }]}
                        />
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Transaktionshistorie
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Datum</TableCell>
                                <TableCell>Vorgang</TableCell>
                                <TableCell align="right">Menge</TableCell>
                                <TableCell align="right">Betrag</TableCell>
                                <TableCell align="right">Gebühren</TableCell>
                                <TableCell align="right">Gesamtmenge</TableCell>
                                <TableCell align="right">Gesamtwert</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {transactions.map((transaction, index) => (
                                <TableRow key={index}>
                                    <TableCell>{transaction.date.toLocaleDateString('de-DE')}</TableCell>
                                    <TableCell>{transaction.type}</TableCell>
                                    <TableCell align="right">{transaction.quantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                                    <TableCell align="right">{formatCurrency(transaction.fees)}</TableCell>
                                    <TableCell align="right">{transaction.totalQuantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(transaction.totalValue)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Box>
                <TableContainer component={Paper} sx={{ maxWidth: 400 }}>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell>Zahlungssumme</TableCell>
                                <TableCell align="right">{formatCurrency(totalPayments)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Gebühren</TableCell>
                                <TableCell align="right">{formatCurrency(totalFees)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        </Container>
    );
};

export default InvestmentDetail; 