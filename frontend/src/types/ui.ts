import { Development } from './api';

export interface ChartPoint {
  date: string;
  [assetId: number]: number | string;
  sum: number;
};

export function developmentsToChartPoints(developments: Development[]): ChartPoint[] {
  // Group developments by date and collect asset IDs
  const grouped = new Map<string, ChartPoint>();
  const assetIdsSet = new Set<number>();

  for (const dev of developments) {
    assetIdsSet.add(dev.investment);
    const dateStr = dev.date.toISOString().slice(0, 10);
    const assetId = dev.investment;

    if (!grouped.has(dateStr)) {
      grouped.set(dateStr, { date: dateStr, sum: 0 });
    }

    const point = grouped.get(dateStr)!;
    point[assetId] = dev.value as number;
    point.sum = Number(point.sum ?? 0) + Number(dev.value);
  }

  // Sort dates and asset IDs
  const sortedDates = Array.from(grouped.keys()).sort();
  const assetIds = Array.from(assetIdsSet).sort();

  // Carry forward last known values per asset
  const lastValues: Record<number, number> = {};
  assetIds.forEach(id => { lastValues[id] = 0; });

  // Build filled chart points
  const filledPoints: ChartPoint[] = sortedDates.map(dateStr => {
    const point = grouped.get(dateStr)!;
    assetIds.forEach(id => {
      if (point[id] !== undefined) {
        lastValues[id] = point[id] as number;
      } else {
        point[id] = lastValues[id];
      }
    });
    // Recalculate total sum
    point.sum = assetIds.reduce((sum, id) => Number(sum) + Number(point[id]), 0);
    return point;
  });
  return filledPoints;
}