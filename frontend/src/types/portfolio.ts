export interface Investment {
    id: number;
    name: string;
    isin: string;
    shortName: string;
    paymentSum: number;
    quantityAfter: number;
    valueAfter: number;
    balance: number;
    endValue: number;
    return: number;
}

export interface PortfolioTotal {
    previousValue: number;
    paymentSum: number;
    valueAfter: number;
    balance: number;
    return: number;
    endValue: number;
}

export interface PortfolioData {
    investments: Investment[];
    performance: PerformanceData[];
    latestDate: Date;
    currentDate: string;
    total: PortfolioTotal;
}

export interface PerformanceData {
    date: Date;
    value: number;
} 