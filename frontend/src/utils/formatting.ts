export const formatCurrency = (value: number, currency: string = 'USD', locale: string = 'de-DE'): string => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatPercentage = (value: number, locale: string = 'de-DE'): string => {
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatNumber = (value: number, locale: string = 'de-DE'): string => {
    return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const formatDate = (date: Date | string, locale: string = 'de-DE'): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
};

export const formatTimeRange = (timeRange: string): string => {
    const translations: Record<string, string> = {
        '1M': '1 Monat',
        '3M': '3 Monate',
        '6M': '6 Monate',
        '1Y': '1 Jahr',
        '3Y': '3 Jahre',
        '5Y': '5 Jahre',
        'ALL': 'Gesamter Zeitraum'
    };
    return translations[timeRange] || timeRange;
}; 