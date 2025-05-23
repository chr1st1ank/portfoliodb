import { describe, it, expect } from 'vitest';
import { irr } from './finmath';


describe('irr', () => {
  it('calculates correct IRR for a basic cash flow', () => {
    const result = irr(
      [new Date('2020-01-01'), new Date('2021-01-01')],
      [-1000, 1100]
    );
    expect(typeof result).toBe('number');
    expect(result as number).toBeCloseTo(0.1);
  });

  it('calculates correct IRR for payments -100.000, 5.000, 105.000 with 5% return', () => {
    const result = irr(
      [
        new Date('2020-01-01'),
        new Date('2021-01-01'),
        new Date('2022-01-01')
      ],
      [-100000, 5000, 105000]
    );
    expect(typeof result).toBe('number');
    expect(result as number).toBeCloseTo(0.0271981262791505);
  });

  it('calculates correct IRR for multiple payments over consecutive years with 5.47% return', () => {
    const result = irr(
      [
        new Date('2020-07-01'),
        new Date('2021-07-01'),
        new Date('2022-07-01'),
        new Date('2023-07-01'),
        new Date('2024-07-01'),
        new Date('2025-07-01'),
        new Date('2026-07-01'),
        new Date('2027-07-01'),
        new Date('2028-07-01'),
        new Date('2029-07-01'),
        new Date('2030-07-01')
      ],
      [-10000, 500, 800, 1200, 1500, 1500, 1500, 1700, 1700, 1700, 1700]
    );
    expect(typeof result).toBe('number');
    expect(result as number).toBeCloseTo(0.054686559524209);
  });


  it('regular payments', () => {
    const result = irr(
      [
        new Date('2020-07-01'),
        new Date('2021-07-01'),
        new Date('2022-07-01'),
        new Date('2023-07-01'),
        new Date('2024-07-01'),
        new Date('2025-07-01'),
        new Date('2026-07-01'),
        new Date('2027-07-01'),
        new Date('2028-07-01'),
        new Date('2029-07-01'),
        new Date('2030-07-01')
      ],
      [-10000, 540, 540, 540, 540, 540, 540, 540, 540, 540, 540]
    );
    expect(typeof result).toBe('number');
    expect(result as number).toBeCloseTo(-0.0987703638354888);
  });

  it('returns error if dates and values have different lengths', () => {
    const result = irr([new Date()], [-1000, 1000]);
    expect(result).toMatch(/must contain the same number/);
  });

  it('returns error if all values are positive', () => {
    const result = irr([new Date(), new Date()], [100, 200]);
    expect(result).toMatch(/Need both positive and negative/);
  });

  it('returns error if all values are negative', () => {
    const result = irr([new Date(), new Date()], [-100, -200]);
    expect(result).toMatch(/Need both positive and negative/);
  });
});
