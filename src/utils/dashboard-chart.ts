import { formatLocalDate, parseLocalDate } from "./local-date";

export type ChartPoint = { date: string; count: number };

export function normalizeChartRange(
  points: ChartPoint[],
  startDate: string,
  endDate: string
): ChartPoint[] {
  const countsByDate = new Map<string, number>();

  for (const point of points) {
    const date = point.date.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < startDate || date > endDate) continue;
    countsByDate.set(date, (countsByDate.get(date) ?? 0) + point.count);
  }

  const normalized: ChartPoint[] = [];
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateKey = formatLocalDate(date);
    normalized.push({ date: dateKey, count: countsByDate.get(dateKey) ?? 0 });
  }

  return normalized;
}
