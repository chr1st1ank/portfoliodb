export interface Investment {
    isin: string;
    name: string;
    previousValue: number;
    paymentSum: number;
    quantityAfter: number;
    valueAfter: number;
    balance: number;
    endValue: number;
    return: number;
}

export interface PortfolioData {
    currentDate: string;
    investments: Investment[];
    total: {
        previousValue: number;
        paymentSum: number;
        valueAfter: number;
        balance: number;
        endValue: number;
        return: number;
    };
}

export interface HistoricalDataPoint {
    date: number;
    value: number;
}

export interface PerformanceData {
    total: HistoricalDataPoint[];
    investments: {
        [key: string]: HistoricalDataPoint[];
    };
} 