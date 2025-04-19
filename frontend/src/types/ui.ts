
import { Development } from './api';

export interface ChartPoint {
  date: string;
  [assetId: number]: number | string;
  sum: number;
};

export function developmentsToChartPoints(developments: Development[]): ChartPoint[] {
  const grouped = new Map<string, ChartPoint>();

  for (const dev of developments) {
    const dateStr = dev.date.toISOString().slice(0, 10);
    const assetId = dev.investment;

    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, { date: dateStr, sum: 0 });
    }

    const point = grouped.get(dateStr)!;
    point[assetId] = dev.value as number;
    point.sum = Number(point.sum ?? 0) + Number(dev.value);
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.localeCompare(b.date));
}