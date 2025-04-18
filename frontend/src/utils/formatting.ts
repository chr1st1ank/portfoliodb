export const formatCurrency = (value: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
};

export const formatTimeRange = (timeRange: string): string => {
    switch (timeRange) {
        case '1M':
            return '1 Month';
        case '3M':
            return '3 Months';
        case '6M':
            return '6 Months';
        case '1Y':
            return '1 Year';
        case '3Y':
            return '3 Years';
        case '5Y':
            return '5 Years';
        case 'ALL':
            return 'All Time';
        default:
            return timeRange;
    }
}; 