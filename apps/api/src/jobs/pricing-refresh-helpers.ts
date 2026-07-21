import type { CatalogSource } from '@kixvault/shared';

export type PriceableSneakerRow = {
  catalogSource: CatalogSource;
  catalogId: string;
  sku: string;
  size: string;
};

export function getWeekStartUtc(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getUTCDay();
  weekStart.setUTCDate(weekStart.getUTCDate() - day);
  weekStart.setUTCHours(0, 0, 0, 0);
  return weekStart;
}

export function dedupeCatalogProducts(
  rows: PriceableSneakerRow[],
): Map<string, PriceableSneakerRow> {
  const products = new Map<string, PriceableSneakerRow>();

  for (const row of rows) {
    const key = `${row.catalogSource}:${row.catalogId}`;

    if (!products.has(key)) {
      products.set(key, row);
    }
  }

  return products;
}

export function hasCompletedRefreshThisWeek(
  completedRuns: Array<{ startedAt: Date }>,
  now: Date,
): boolean {
  const weekStart = getWeekStartUtc(now);
  return completedRuns.some((run) => run.startedAt >= weekStart);
}
