import { describe, expect, it } from "vitest";
import { developmentsToChartPoints } from "./ui";

describe("developmentsToChartPoints", () => {
  it("transforms Development[] into ChartPoint[] correctly", () => {
    const input = [
      // Day 1
      { investment: 1, date: new Date("2025-03-01"), quantity: 10, price: 10, value: 100 },
      { investment: 2, date: new Date("2025-03-01"), quantity: 15, price: 10, value: 150 },

      // Day 2
      { investment: 1, date: new Date("2025-03-02"), quantity: 10, price: 8, value: 80 },
      { investment: 2, date: new Date("2025-03-02"), quantity: 15, price: 10, value: 0 },

      // Day 3
      { investment: 3, date: new Date("2025-03-03"), quantity: 10, price: 8, value: 20 },
    ];

    const expected = [
      { date: "2025-03-01", 1: 100, 2: 150, 3: 0, sum: 250 },
      { date: "2025-03-02", 1: 80, 2: 0, 3: 0, sum: 80 },
      { date: "2025-03-03", 1: 80, 2: 0, 3: 20, sum: 100 },
    ];

    const result = developmentsToChartPoints(input);
    expect(result).toEqual(expected);
  });

  it("fills missing points with last known value or zero", () => {
    const input = [
      { investment: 1, date: new Date("2025-01-01"), quantity: 0, price: 0, value: 10 },
      { investment: 2, date: new Date("2025-01-03"), quantity: 0, price: 0, value: 30 },
      { investment: 1, date: new Date("2025-01-04"), quantity: 0, price: 0, value: 20 },
    ];

    const expected = [
      { date: "2025-01-01", 1: 10, 2: 0, sum: 10 },
      { date: "2025-01-03", 1: 10, 2: 30, sum: 40 },
      { date: "2025-01-04", 1: 20, 2: 30, sum: 50 },
    ];

    const result = developmentsToChartPoints(input);
    expect(result).toEqual(expected);
  });
});
