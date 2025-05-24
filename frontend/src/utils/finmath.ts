import uniroot from "./uniroot";

/**
 * Computes the internal rate of return (IRR) for a series of cash flows at given dates.
 * Uses Brent's method to solve for the rate where the net present value equals zero.
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

    // Brent's method parameters
    const maxIterations = 100;
    const tolerance = 1e-10;
    
    // Initial bounds for the search
    let a = -0.9; // Lower bound
    let b = 2.0;  // Upper bound
    

    // Find the earliest date in the array
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));

    // Helper function to calculate days between dates
    const daysBetween = (date1: Date, date2: Date): number => {
        // Use UTC dates to avoid timezone and DST issues
        const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
        const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
        return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
    };

    // Function to calculate NPV at a given rate
    const npv = (rate: number): number => {
        let sum = 0;
        for (let i = 0; i < dates.length; i++) {
            const time = daysBetween(startDate, dates[i]) / 365.2425;
            // Use the same discounting approach as the original implementation
            sum += values[i] / Math.pow(1 + rate, time);
        }
        return sum;
    };
    
    const root = uniroot(npv, a, b, tolerance, maxIterations);

    if (root === undefined) {
        return `IRR did not converge in ${maxIterations} iterations`;
    }
    
    return root;
}
