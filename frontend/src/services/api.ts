import axios from 'axios';
import { Movement, Investment, InvestmentPrice, Development, ActionType } from '../types/api';

const API_BASE_URL = 'http://localhost:8000/api';

const convertDates = (data: any[]): any[] => {
    return data.map(item => ({
        ...item,
        date: new Date(item.date)
    }));
};

// Format date to YYYY-MM-DD for Django backend
const formatDateForBackend = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

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
            return convertDates(response.data);
        },
    },
    movements: {
        getAll: async (): Promise<Movement[]> => {
            const response = await axios.get(`${API_BASE_URL}/movements/`);
            return convertDates(response.data);
        },
        delete: async (id: number): Promise<void> => {
            await axios.delete(`${API_BASE_URL}/movements/${id}/`);
        },
        create: async (movement: Omit<Movement, 'id'>): Promise<Movement> => {
            // Format the date and ensure decimal fields are properly formatted
            const formattedMovement = {
                ...movement,
                date: formatDateForBackend(movement.date),
                quantity: Number(movement.quantity),
                amount: Number(movement.amount),
                fee: Number(movement.fee)
            };
            
            const response = await axios.post(`${API_BASE_URL}/movements/`, formattedMovement);
            return {
                ...response.data,
                date: new Date(response.data.date)
            };
        },
        update: async (id: number, movement: Omit<Movement, 'id'>): Promise<Movement> => {
            // Format the date and ensure decimal fields are properly formatted
            const formattedMovement = {
                ...movement,
                date: formatDateForBackend(movement.date),
                quantity: Number(movement.quantity),
                amount: Number(movement.amount),
                fee: Number(movement.fee)
            };
            
            const response = await axios.put(`${API_BASE_URL}/movements/${id}/`, formattedMovement);
            return {
                ...response.data,
                date: new Date(response.data.date)
            };
        },
    },
    developments: {
        getAll: async (): Promise<Development[]> => {
            const response = await axios.get(`${API_BASE_URL}/developments/`);
            return convertDates(response.data);
        },
    },
}; 