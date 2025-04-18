import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export interface Investment {
    id: number;
    name: string;
    isin: string;
    short_name: string;
}

export interface InvestmentPrice {
    id: number;
    investment: number;
    date: string;
    price: number;
}

export interface Movement {
    id: number;
    date: string;
    action: number;
    investment: number;
    quantity: number;
    amount: number;
    fee: number;
}

export interface ActionType {
    id: number;
    name: string;
}

export interface Development {
    investment: number;
    date: string;
    price: number;
    quantity: number;
    value: number;
}

export const api = {
    actionTypes: {
        getAll: async (): Promise<ActionType[]> => {
            const response = await axios.get(`${API_BASE_URL}/actiontypes/`);
            return response.data;
        },
    },
    investments: {
        getAll: async (): Promise<Investment[]> => {
            const response = await axios.get(`${API_BASE_URL}/investments/`);
            return response.data;
        },
    },
    investmentPrices: {
        getAll: async (): Promise<InvestmentPrice[]> => {
            const response = await axios.get(`${API_BASE_URL}/investmentprices/`);
            return response.data;
        },
    },
    movements: {
        getAll: async (): Promise<Movement[]> => {
            const response = await axios.get(`${API_BASE_URL}/movements/`);
            return response.data;
        },
    },
    developments: {
        getAll: async (): Promise<Development[]> => {
            const response = await axios.get(`${API_BASE_URL}/developments/`);
            return response.data;
        },
    },
}; 