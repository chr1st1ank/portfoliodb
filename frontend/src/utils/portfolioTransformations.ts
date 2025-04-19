import { Investment, Development, Movement } from '../types/api';
import { InvestmentPerformance } from '../types/portfolio';

export function calculateInvestmentData(
    investment: Investment,
    developments: Development[],
    movements: Movement[],
    targetDate: Date
) {
    const investmentDevelopments = developments
        .filter((d: Development) => d.investment === investment.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find the development closest to but not after the target date
    const relevantDevelopment = investmentDevelopments
        .filter(d => new Date(d.date) <= targetDate)
        .pop() || investmentDevelopments[0];

    const quantity = parseFloat(relevantDevelopment?.quantity?.toString() || '0');
    const value = parseFloat(relevantDevelopment?.value?.toString() || '0');

    // Calculate payment sum from movements up to the target date
    const paymentSum = movements
        .filter(m => m.investment === investment.id && new Date(m.date) <= targetDate)
        .reduce((sum, movement) => {
            const amount = parseFloat(movement.amount?.toString() || '0');
            const fee = parseFloat(movement.fee?.toString() || '0');

            // For buys (1), add amount and fee
            // For sells (2), subtract amount and add fee
            // For dividends (3), subtract amount and add fee
            if (movement.action === 1) {
                return sum + amount + fee;
            } else if (movement.action === 2 || movement.action === 3) {
                return sum - amount + fee;
            }
            return sum;
        }, 0);

    // Calculate balance and return
    const balance = value - paymentSum;
    const returnValue = paymentSum > 0 ? Number(((value - paymentSum) / paymentSum * 100).toFixed(2)) : 0;

    return {
        id: investment.id,
        name: investment.name,
        isin: investment.isin,
        shortname: investment.shortname,
        paymentSum,
        quantityAfter: quantity,
        valueAfter: value,
        balance,
        return: returnValue,
    };
}

export function calculateInvestmentPerformance(
    developments: Development[],
    investments: Investment[],
    targetDate: Date
): InvestmentPerformance[] {
    const developmentsByDate = developments
        .filter(d => new Date(d.date) <= targetDate)
        .reduce((acc: { [key: string]: Development[] }, dev: Development) => {
            if (!dev.date) return acc;
            const date = new Date(dev.date).getTime();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(dev);
            return acc;
        }, {});

    return Object.entries(developmentsByDate)
        .map(([date, devs]) => {
            const totalValue = devs.reduce((sum: number, dev: Development) => {
                const value = parseFloat(dev.value?.toString() || '0');
                return sum + (isNaN(value) ? 0 : value);
            }, 0);

            const performance: any = {
                date: new Date(parseInt(date)),
                value: totalValue,
            };

            devs.forEach((dev: Development) => {
                const investment = investments.find(inv => inv.id === dev.investment);
                if (investment) {
                    performance[investment.isin] = parseFloat(dev.value?.toString() || '0');
                }
            });

            return performance;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function calculateTotals(investments: any[]) {
    return {
        previousValue: investments.reduce((sum, inv) => sum + (inv.valueAfter - inv.paymentSum), 0),
        paymentSum: investments.reduce((sum, inv) => sum + inv.paymentSum, 0),
        valueAfter: investments.reduce((sum, inv) => sum + inv.valueAfter, 0),
        balance: investments.reduce((sum, inv) => sum + (inv.valueAfter - inv.paymentSum), 0),
        return: investments.reduce((sum, inv) => sum + inv.return, 0),
    };
} 

export function filterDevelopmentsByDate(
    developments: Development[],
    minDate: Date,
    maxDate: Date
  ): Development[] {
    return developments.filter(dev =>
      dev.date >= minDate && dev.date <= maxDate
    );
}
  