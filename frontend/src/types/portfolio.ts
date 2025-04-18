import { Movement } from './api';

export interface InvestmentData {
    id: number;
    name: string;
    isin: string;
    shortName: string;
    paymentSum: number;
    quantityAfter: number;
    valueAfter: number;
    balance: number;
    return: number;
}

export interface PortfolioTotal {
    previousValue: number;
    paymentSum: number;
    valueAfter: number;
    balance: number;
    return: number;
}

export interface PortfolioData {
    investments: InvestmentData[];
    performance: PerformanceData[];
    movements: Movement[];
    latestDate: Date;
    currentDate: string;
    total: PortfolioTotal;
}

export interface InvestmentPerformance {
    date: Date;
    value: number;
    investmentValues: Record<string, number>;  // ISIN -> value mapping
}

export interface PerformanceData extends InvestmentPerformance { }

export type TimeRange = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL'; 