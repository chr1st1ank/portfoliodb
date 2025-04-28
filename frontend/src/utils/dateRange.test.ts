import { getDateRange } from './dateRange';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('getDateRange', () => {
    const baseDates = ['2021-01-15', '2021-03-15', '2021-06-15'];
    const fixedLatestDate = new Date('2021-06-15');
    
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(fixedLatestDate);
    });
    
    afterEach(() => {
        vi.useRealTimers();
    });

    it('should default endDate to latest date in array', () => {
        const { startDate, endDate } = getDateRange(baseDates, '1M');
        expect(startDate).toEqual(new Date('2021-05-15'));
        expect(endDate).toEqual(new Date('2021-06-15'));
    });

    it('should calculate correct 1M range', () => {
        const { startDate, endDate } = getDateRange(baseDates, '1M');
        const expectedStart = new Date('2021-06-15');
        expectedStart.setMonth(expectedStart.getMonth() - 1);
        expect(startDate).toEqual(expectedStart);
        expect(endDate).toEqual(new Date('2021-06-15'));
    });

    it('should calculate correct 3M range', () => {
        const { startDate, endDate } = getDateRange(baseDates, '3M');
        const expectedStart = new Date('2021-06-15');
        expectedStart.setMonth(expectedStart.getMonth() - 3);
        expect(startDate).toEqual(expectedStart);
        expect(endDate).toEqual(new Date('2021-06-15'));
    });

    it('should calculate correct 6M range', () => {
        const { startDate, endDate } = getDateRange(baseDates, '6M');
        const expectedStart = new Date('2021-06-15');
        expectedStart.setMonth(expectedStart.getMonth() - 6);
        expect(startDate).toEqual(expectedStart);
        expect(endDate).toEqual(new Date('2021-06-15'));
    });

    it('should calculate correct 1Y range', () => {
        const { startDate, endDate } = getDateRange(baseDates, '1Y');
        const expectedStart = new Date('2021-06-15');
        expectedStart.setFullYear(expectedStart.getFullYear() - 1);
        expect(startDate).toEqual(expectedStart);
        expect(endDate).toEqual(new Date('2021-06-15'));
    });

    it('should handle ALL range', () => {
        const { startDate, endDate } = getDateRange(baseDates, 'ALL');
        expect(startDate).toEqual(new Date('2021-01-15'));
        expect(endDate).toEqual(new Date('2021-06-15'));
    });

    it('should use provided endDate', () => {
        const customEnd = new Date('2022-12-31');
        const { startDate, endDate } = getDateRange(baseDates, '1M', customEnd);
        expect(endDate).toEqual(new Date('2021-06-15'));
        const expectedStart = new Date('2021-06-15');
        expectedStart.setMonth(expectedStart.getMonth() - 1);
        expect(startDate).toEqual(expectedStart);
    });

    it('should handle empty dates array', () => {
        const { startDate, endDate } = getDateRange([], '1M');
        const expectedStart = new Date(fixedLatestDate);
        expectedStart.setMonth(expectedStart.getMonth() - 1);
        expect(startDate).toEqual(expectedStart);
        expect(endDate).toEqual(fixedLatestDate);
    });

    it('should throw error on unsupported range', () => {
        // @ts-expect-error testing invalid input
        expect(() => getDateRange(baseDates, '2Y')).toThrow();
    });
});