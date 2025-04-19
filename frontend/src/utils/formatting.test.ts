import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, formatNumber, formatDate, formatTimeRange } from './formatting';

describe('formatting utilities', () => {
    describe('formatCurrency', () => {
        it('formats USD currency correctly in German', () => {
            expect(formatCurrency(1234.56)).toBe('1.234,56 €');
            expect(formatCurrency(0)).toBe('0,00 €');
            expect(formatCurrency(-1234.56)).toBe('-1.234,56 €');
        });

        it('formats different currencies correctly in German', () => {
            expect(formatCurrency(1234.56, 'USD')).toBe('1.234,56 $');
            expect(formatCurrency(1234.56, 'JPY')).toBe('1.234,56 ¥');
        });

        it('formats USD currency correctly in English', () => {
            expect(formatCurrency(1234.56, 'USD', 'en-US')).toBe('$1,234.56');
            expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00');
            expect(formatCurrency(-1234.56, 'USD', 'en-US')).toBe('-$1,234.56');
        });
    });

    describe('formatPercentage', () => {
        it('formats percentages correctly in German', () => {
            expect(formatPercentage(0.1234)).toBe('12,34 %');
            expect(formatPercentage(1)).toBe('100,00 %');
            expect(formatPercentage(-0.1234)).toBe('-12,34 %');
        });

        it('formats percentages correctly in English', () => {
            expect(formatPercentage(0.1234, 'en-US')).toBe('12.34%');
            expect(formatPercentage(1, 'en-US')).toBe('100.00%');
            expect(formatPercentage(-0.1234, 'en-US')).toBe('-12.34%');
        });
    });

    describe('formatNumber', () => {
        it('formats numbers correctly in German', () => {
            expect(formatNumber(1234.5678)).toBe('1.234,57');
            expect(formatNumber(0)).toBe('0,00');
            expect(formatNumber(-1234.5678)).toBe('-1.234,57');
        });

        it('formats numbers correctly in English', () => {
            expect(formatNumber(1234.5678, 'en-US')).toBe('1,234.57');
            expect(formatNumber(0, 'en-US')).toBe('0.00');
            expect(formatNumber(-1234.5678, 'en-US')).toBe('-1,234.57');
        });
    });

    describe('formatDate', () => {
        it('formats Date objects correctly in German', () => {
            const date = new Date('2023-01-15');
            expect(formatDate(date)).toBe('15. Jan. 2023');
        });

        it('formats date strings correctly in German', () => {
            expect(formatDate('2023-01-15')).toBe('15. Jan. 2023');
        });

        it('formats Date objects correctly in English', () => {
            const date = new Date('2023-01-15');
            expect(formatDate(date, 'en-US')).toBe('Jan 15, 2023');
        });
    });

    describe('formatTimeRange', () => {
        it('formats all time ranges correctly in German', () => {
            expect(formatTimeRange('1M')).toBe('1 Monat');
            expect(formatTimeRange('3M')).toBe('3 Monate');
            expect(formatTimeRange('6M')).toBe('6 Monate');
            expect(formatTimeRange('1Y')).toBe('1 Jahr');
            expect(formatTimeRange('3Y')).toBe('3 Jahre');
            expect(formatTimeRange('5Y')).toBe('5 Jahre');
            expect(formatTimeRange('ALL')).toBe('Gesamter Zeitraum');
        });

        it('returns unknown time ranges as is', () => {
            expect(formatTimeRange('unknown')).toBe('unknown');
        });
    });
}); 