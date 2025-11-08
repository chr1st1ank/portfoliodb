export interface Movement {
    id: number;
    date: Date;
    action: number;
    investment: number;
    quantity: number;
    amount: number;
    fee: number;
}

export interface Investment {
    id: number;
    name: string;
    isin: string;
    shortname: string;
    ticker_symbol?: string;
    quote_provider?: string;
}

export interface InvestmentPrice {
    id: number;
    investment: number;
    date: Date;
    price: number;
}

export interface Development {
    investment: number;
    date: Date;
    quantity: number;
    value: number;
    price: number;
}

export interface ActionType {
    id: number;
    name: string;
} 