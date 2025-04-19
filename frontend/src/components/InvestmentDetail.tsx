import React, { useState } from 'react';
import { Box, Container, Typography, Paper, ToggleButtonGroup, ToggleButton, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { InvestmentData, TimeRange } from '../types/portfolio';
import { Movement, Development, Investment } from '../types/api';
import PerformanceChart from './PerformanceChart';
import { formatAction, formatDate } from '../utils/formatting';
import { getDateRange } from '../utils/dateRange';

interface InvestmentDetailProps {
    investment: InvestmentData;
    movements: Movement[];
    developments: Development[];
}

const InvestmentDetail: React.FC<InvestmentDetailProps> = ({ investment, movements, developments }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
    const [endDate, setEndDate] = useState<Date>(new Date());

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
        date && setEndDate(date);
    };

    const totalFees = movements.reduce((sum, m) => sum + m.fee, 0);
    const totalPayments = movements.reduce((sum, m) => sum + Math.abs(m.amount), 0);

    // Prepare data for PerformanceChart
    const perfInvestments: Investment[] = [{ id: investment.id, name: investment.name, isin: investment.isin, shortname: investment.shortname }];
    const dateRange = getDateRange(developments.map(d => d.date), timeRange, endDate);

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
                            developments={developments}
                            dateRange={dateRange}
                            investments={perfInvestments}
                            totalsName=''
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
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {movements.map((movement, index) => (
                                <TableRow key={index}>
                                    <TableCell>{formatDate(movement.date)}</TableCell>
                                    <TableCell>{formatAction(movement.action)}</TableCell>
                                    <TableCell align="right">{movement.quantity}</TableCell>
                                    <TableCell align="right">{formatCurrency(movement.amount)}</TableCell>
                                    <TableCell align="right">{formatCurrency(movement.fee)}</TableCell>
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