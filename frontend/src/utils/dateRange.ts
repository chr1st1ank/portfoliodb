import { TimeRange } from "../types/portfolio";

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

/**
 * Calculates a date range based on provided dates, a timeRange, and optional endDate.
 */
export function getDateRange(
    dates: Array<string | Date>,
    timeRange: TimeRange,
    endDate?: Date
): DateRange {
    const timestamps = dates
        .map(d => new Date(d).getTime())
        .filter(t => !isNaN(t));

    const lastDataDate =
        timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();

    const endDateValue = (endDate && endDate < lastDataDate) ? endDate : lastDataDate;
    let startDate = new Date(endDateValue);

    switch (timeRange) {
        case '1M':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case '3M':
            startDate.setMonth(startDate.getMonth() - 3);
            break;
        case '6M':
            startDate.setMonth(startDate.getMonth() - 6);
            break;
        case '1Y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case 'ALL':
            startDate =
                timestamps.length > 0 ? new Date(Math.min(...timestamps)) : new Date();
            break;
        default:
            throw new Error(`Unsupported timeRange: ${timeRange}`);
    }

    return { startDate, endDate: endDateValue };
}