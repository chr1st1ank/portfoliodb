import { describe, it, expect } from 'vitest';
import { calculateInvestmentData, calculateInvestmentPerformance, calculateTotals } from './portfolioTransformations';
import { Investment, Development, Movement } from '../types/api';

describe('portfolio transformations', () => {
    describe('calculateInvestmentData', () => {
        it('calculates investment data correctly with no developments', () => {
            const investment: Investment = {
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
            };

            const result = calculateInvestmentData(investment, [], [], new Date());

            expect(result).toEqual({
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
                paymentSum: 0,
                quantityAfter: 0,
                valueAfter: 0,
                balance: 0,
                return: 0,
            });
        });

        it('calculates investment data with developments and movements', () => {
            const investment: Investment = {
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
            };

            const developments: Development[] = [
                {
                    investment: 1,
                    date: new Date('2023-01-01'),
                    quantity: 100,
                    value: 1000,
                    price: 10,
                },
                {
                    investment: 1,
                    date: new Date('2023-01-02'),
                    quantity: 150,
                    value: 1500,
                    price: 10,
                },
            ];

            const movements: Movement[] = [
                {
                    id: 1,
                    investment: 1,
                    date: new Date('2023-01-01'),
                    action: 1,
                    amount: 500,
                    fee: 10,
                    quantity: 100,
                },
            ];

            const result = calculateInvestmentData(
                investment,
                developments,
                movements,
                new Date('2023-01-02')
            );

            expect(result).toEqual({
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
                paymentSum: 510,
                quantityAfter: 150,
                valueAfter: 1500,
                balance: 990,
                return: 194.12,
            });
        });

        it('calculates investment data with sell action', () => {
            const investment: Investment = {
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
            };

            const developments: Development[] = [
                {
                    investment: 1,
                    date: new Date('2023-01-01'),
                    quantity: 100,
                    value: 1000,
                    price: 10,
                },
                {
                    investment: 1,
                    date: new Date('2023-01-02'),
                    quantity: 50,
                    value: 500,
                    price: 10,
                },
            ];

            const movements: Movement[] = [
                {
                    id: 1,
                    investment: 1,
                    date: new Date('2023-01-01'),
                    action: 1,
                    amount: 1000,
                    fee: 10,
                    quantity: 100,
                },
                {
                    id: 2,
                    investment: 1,
                    date: new Date('2023-01-02'),
                    action: 2,
                    amount: 500,
                    fee: 5,
                    quantity: 50,
                },
            ];

            const result = calculateInvestmentData(
                investment,
                developments,
                movements,
                new Date('2023-01-02')
            );

            expect(result).toEqual({
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
                paymentSum: 515, // 1010 (buy) - 500 (sell) + 5 (sell fee)
                quantityAfter: 50,
                valueAfter: 500,
                balance: -15,
                return: -2.91,
            });
        });

        it('calculates investment data with dividend action', () => {
            const investment: Investment = {
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
            };

            const developments: Development[] = [
                {
                    investment: 1,
                    date: new Date('2023-01-01'),
                    quantity: 100,
                    value: 1000,
                    price: 10,
                },
                {
                    investment: 1,
                    date: new Date('2023-01-02'),
                    quantity: 100,
                    value: 1000,
                    price: 10,
                },
            ];

            const movements: Movement[] = [
                {
                    id: 1,
                    investment: 1,
                    date: new Date('2023-01-01'),
                    action: 1,
                    amount: 1000,
                    fee: 10,
                    quantity: 100,
                },
                {
                    id: 2,
                    investment: 1,
                    date: new Date('2023-01-02'),
                    action: 3,
                    amount: 50,
                    fee: 1,
                    quantity: 0,
                },
            ];

            const result = calculateInvestmentData(
                investment,
                developments,
                movements,
                new Date('2023-01-02')
            );

            expect(result).toEqual({
                id: 1,
                name: 'Test Investment',
                isin: 'TEST123',
                shortname: 'TEST',
                paymentSum: 961, // 1010 (buy) - 50 (dividend) + 1 (dividend fee)
                quantityAfter: 100,
                valueAfter: 1000,
                balance: 39,
                return: 4.06,
            });
        });
    });

    describe('calculateInvestmentPerformance', () => {
        it('calculates performance data correctly', () => {
            const investments: Investment[] = [
                {
                    id: 1,
                    name: 'Test Investment 1',
                    isin: 'TEST1',
                    shortname: 'T1',
                },
                {
                    id: 2,
                    name: 'Test Investment 2',
                    isin: 'TEST2',
                    shortname: 'T2',
                },
            ];

            const developments: Development[] = [
                {
                    investment: 1,
                    date: new Date('2023-01-01'),
                    quantity: 100,
                    value: 1000,
                    price: 10,
                },
                {
                    investment: 2,
                    date: new Date('2023-01-01'),
                    quantity: 200,
                    value: 2000,
                    price: 10,
                },
                {
                    investment: 1,
                    date: new Date('2023-01-02'),
                    quantity: 150,
                    value: 1500,
                    price: 10,
                },
            ];

            const result = calculateInvestmentPerformance(
                developments,
                investments,
                new Date('2023-01-02')
            );

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                date: new Date('2023-01-01'),
                value: 3000,
                TEST1: 1000,
                TEST2: 2000,
            });
            expect(result[1]).toEqual({
                date: new Date('2023-01-02'),
                value: 1500,
                TEST1: 1500,
            });
        });
    });

    describe('calculateTotals', () => {
        it('calculates totals correctly', () => {
            const investments = [
                {
                    valueAfter: 1000,
                    balance: 500,
                    paymentSum: -500,
                    return: 10,
                },
                {
                    valueAfter: 2000,
                    balance: 1000,
                    paymentSum: 1000,
                    return: 20,
                },
            ];

            const result = calculateTotals(investments);

            expect(result).toEqual({
                previousValue: 2500,
                paymentSum: 500,
                valueAfter: 3000,
                balance: 2500,
                return: 30,
            });
        });
    });
});


import { filterDevelopmentsByDate } from './portfolioTransformations';


describe('filterDevelopmentsByDate', () => {
    const devs: Development[] = [
        { investment: 1, date: new Date('2024-01-01'), quantity: 10, value: 100, price: 10 },
        { investment: 2, date: new Date('2024-02-01'), quantity: 20, value: 200, price: 10 },
        { investment: 3, date: new Date('2024-03-01'), quantity: 30, value: 300, price: 10 },
    ];

    it('includes values strictly between min and max dates', () => {
        const res = filterDevelopmentsByDate(devs, new Date('2024-01-15'), new Date('2024-02-15'));
        expect(res).toHaveLength(1);
        expect(res[0].investment).toBe(2);
    });

    it('includes values equal to min and max date', () => {
        const res = filterDevelopmentsByDate(devs, new Date('2024-01-01'), new Date('2024-03-01'));
        expect(res).toHaveLength(3);
    });

    it('returns empty array if no match', () => {
        const res = filterDevelopmentsByDate(devs, new Date('2025-01-01'), new Date('2025-12-31'));
        expect(res).toHaveLength(0);
    });

    it('returns empty array for empty input', () => {
        const res = filterDevelopmentsByDate([], new Date('2024-01-01'), new Date('2024-12-31'));
        expect(res).toHaveLength(0);
    });

    it('handles reversed min/max date (no match)', () => {
        const res = filterDevelopmentsByDate(devs, new Date('2024-03-01'), new Date('2024-01-01'));
        expect(res).toHaveLength(0);
    });

    it('handles identical min and max date', () => {
        const res = filterDevelopmentsByDate(devs, new Date('2024-02-01'), new Date('2024-02-01'));
        expect(res).toHaveLength(1);
        expect(res[0].investment).toBe(2);
    });
});
