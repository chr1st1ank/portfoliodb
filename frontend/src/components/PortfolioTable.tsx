import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Link,
} from '@mui/material';
import { PortfolioData } from '../types/portfolio';

interface PortfolioTableProps {
    data: PortfolioData;
}

const PortfolioTable: React.FC<PortfolioTableProps> = ({ data }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
    };

    const formatPercentage = (value: number) => {
        return `${value.toFixed(2)}%`;
    };

    // Filter investments to only include those with quantity >= 0
    const activeInvestments = data.investments.filter(investment => investment.quantityAfter >= 0);

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ISIN</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell align="right">Payment Sum</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Current Value</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell align="right">Return</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {activeInvestments.map((investment) => (
                        <TableRow key={investment.isin}>
                            <TableCell>
                                <Link
                                    href={`https://www.comdirect.de/inf/etfs/detail/uebersicht.html?ID_NOTATION=${investment.isin}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {investment.isin}
                                </Link>
                            </TableCell>
                            <TableCell>{investment.name}</TableCell>
                            <TableCell align="right">{formatCurrency(investment.paymentSum)}</TableCell>
                            <TableCell align="right">{investment.quantityAfter}</TableCell>
                            <TableCell align="right">{formatCurrency(investment.valueAfter)}</TableCell>
                            <TableCell align="right" style={{ color: investment.balance >= 0 ? 'green' : 'red' }}>
                                {formatCurrency(investment.balance)}
                            </TableCell>
                            <TableCell align="right" style={{ color: investment.return >= 0 ? 'green' : 'red' }}>
                                {formatPercentage(investment.return)}
                            </TableCell>
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell colSpan={2}><strong>Total</strong></TableCell>
                        <TableCell align="right"><strong>{formatCurrency(data.total.paymentSum)}</strong></TableCell>
                        <TableCell align="right">-</TableCell>
                        <TableCell align="right"><strong>{formatCurrency(data.total.valueAfter)}</strong></TableCell>
                        <TableCell align="right" style={{ color: data.total.balance >= 0 ? 'green' : 'red' }}>
                            <strong>{formatCurrency(data.total.balance)}</strong>
                        </TableCell>
                        <TableCell align="right" style={{ color: data.total.return >= 0 ? 'green' : 'red' }}>
                            <strong>{formatPercentage(data.total.return)}</strong>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PortfolioTable; 