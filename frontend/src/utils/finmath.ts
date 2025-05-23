/**
 * Computes the internal rate of return (IRR) for a series of cash flows at given dates.
 * Uses an iterative method to solve for the rate where discounted inflows equal outflows.
 *
 * @param dates - Array of JavaScript Date objects representing the timing of each cash flow.
 * @param values - Array of numbers representing the cash flows (positive for inflow, negative for outflow).
 * @returns The IRR as a decimal (e.g., 0.12 for 12%) or a string describing an error.
 *
 * @example
 * irr([new Date('2022-01-01'), new Date('2023-01-01')], [-1000, 1100]);
 */
export function irr(dates: Date[], values: number[]): number | string {
    if (dates.length !== values.length) {
        return "dates and values must contain the same number of elements!";
    }

    let hasPositive = false;
    let hasNegative = false;

    for (const value of values) {
        if (value > 0) hasPositive = true;
        if (value < 0) hasNegative = true;
        if (hasPositive && hasNegative) break;
    }

    if (!hasPositive || !hasNegative) {
        return "Need both positive and negative values!";
    }

    const epsilon = 1e-7;
    const maxIterations = 20;
    // Find the earliest date in the array
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));

    // Helper function to calculate days between dates
    const daysBetween = (date1: Date, date2: Date): number => {
        // Use UTC dates to avoid timezone and DST issues
        const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
        return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    };

    let u = 0; // Initial rate guess

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let positive = 0, dPositive = 0;
        let negative = 0, dNegative = 0;

        for (let i = 0; i < dates.length; i++) {
            const value = values[i];
            const time = daysBetween(startDate, dates[i]) / 365.2425;

            if (value > 0) {
                const temp = value * Math.exp(u * time);
                positive += temp;
                dPositive += temp * time;
            } else if (value < 0) {
                const temp = -value * Math.exp(u * time);
                negative += temp;
                dNegative += temp * time;
            }
        }

        const delta = Math.log(negative / positive) /
            ((dNegative / negative) - (dPositive / positive));

        if (Math.abs(delta) < epsilon) {
            return -u;
        }

        u -= delta;
    }

    return `IRR did not converge in ${maxIterations} iterations`;
}
