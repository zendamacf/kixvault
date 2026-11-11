import type {
  Analytics,
  BrandBreakdownEntry,
  ConditionBreakdownEntry,
  DepartureType,
  MostWornEntry,
  PortfolioValuePoint,
  RealizedSale,
  RealizedSummary,
  SneakerCondition,
  WearsByMonthPoint,
} from '@kixvault/shared';
import { sneakerConditions } from '@kixvault/shared';

export type AnalyticsSneaker = {
  id: string;
  brand: string;
  model: string;
  nickname: string | null;
  condition: SneakerCondition;
  size: string;
  sku: string | null;
  catalogSource: string | null;
  purchaseDate: string | null;
  purchasePrice?: string | null;
  /** Set when the pair left the vault. */
  departureType?: DepartureType | null;
  /** `YYYY-MM-DD` */
  departedOn?: string | null;
  salePrice?: string | null;
};

export type AnalyticsSnapshot = {
  catalogSource: string;
  sku: string;
  size: string;
  /** `YYYY-MM-DD` */
  snapshotDate: string;
  price: string;
};

export type AnalyticsWear = {
  sneakerId: string;
  /** `YYYY-MM-DD` */
  wornOn: string;
};

export const WEARS_MONTHS = 12;
export const MOST_WORN_LIMIT = 5;
export const BRAND_LIMIT = 6;

function pairKey(source: string, sku: string, size: string): string {
  return `${source}:${sku}:${Number(size).toFixed(1)}`;
}

function sneakerKey(sneaker: AnalyticsSneaker): string | null {
  if (!sneaker.catalogSource || !sneaker.sku) {
    return null;
  }

  return pairKey(sneaker.catalogSource, sneaker.sku, sneaker.size);
}

/**
 * Total market value of the collection on each snapshot date.
 *
 * Each pair uses its most recent snapshot on or before the date (so a missed snapshot does not
 * drop the pair out of the total), and only counts from its purchase date when one is set.
 * A retired pair stops counting after its departure date, so earlier points keep its value.
 * Pairs without a catalog link, or without any snapshot yet, are skipped.
 */
export function buildPortfolioValue(
  sneakers: AnalyticsSneaker[],
  snapshots: AnalyticsSnapshot[],
): PortfolioValuePoint[] {
  const byPair = new Map<string, { date: string; price: number }[]>();

  for (const snapshot of snapshots) {
    const key = pairKey(snapshot.catalogSource, snapshot.sku, snapshot.size);
    const list = byPair.get(key) ?? [];
    list.push({ date: snapshot.snapshotDate, price: Number(snapshot.price) });
    byPair.set(key, list);
  }

  for (const list of byPair.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }

  const tracked = sneakers.flatMap((sneaker) => {
    const key = sneakerKey(sneaker);
    const history = key ? byPair.get(key) : undefined;
    return history
      ? [{ history, ownedFrom: sneaker.purchaseDate, ownedUntil: sneaker.departedOn ?? null }]
      : [];
  });

  const dates = [...new Set(tracked.flatMap((item) => item.history.map((entry) => entry.date)))];
  dates.sort();

  const points: PortfolioValuePoint[] = [];

  for (const date of dates) {
    let value = 0;
    let pairs = 0;

    for (const item of tracked) {
      if (item.ownedFrom && item.ownedFrom > date) {
        continue;
      }

      if (item.ownedUntil && item.ownedUntil < date) {
        continue;
      }

      let latest: number | null = null;
      for (const entry of item.history) {
        if (entry.date > date) {
          break;
        }
        latest = entry.price;
      }

      if (latest !== null) {
        value += latest;
        pairs += 1;
      }
    }

    if (pairs > 0) {
      points.push({ date, value, pairs });
    }
  }

  return points;
}

/** Wear counts for the `months` calendar months ending at `now`'s month, oldest first. */
export function buildWearsByMonth(
  wears: AnalyticsWear[],
  now: Date,
  months = WEARS_MONTHS,
): WearsByMonthPoint[] {
  const counts = new Map<string, number>();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    counts.set(date.toISOString().slice(0, 7), 0);
  }

  for (const wear of wears) {
    const month = wear.wornOn.slice(0, 7);
    const current = counts.get(month);
    if (current !== undefined) {
      counts.set(month, current + 1);
    }
  }

  return [...counts.entries()].map(([month, count]) => ({ month, count }));
}

export function sneakerDisplayName(sneaker: Pick<AnalyticsSneaker, 'model' | 'nickname'>): string {
  return sneaker.nickname?.trim() || sneaker.model;
}

/** Most-worn pairs of all time, most worn first. Ties break alphabetically by name. */
export function buildMostWorn(
  wears: AnalyticsWear[],
  sneakers: AnalyticsSneaker[],
  limit = MOST_WORN_LIMIT,
): MostWornEntry[] {
  const counts = new Map<string, number>();
  for (const wear of wears) {
    counts.set(wear.sneakerId, (counts.get(wear.sneakerId) ?? 0) + 1);
  }

  const entries: MostWornEntry[] = [];
  for (const sneaker of sneakers) {
    const count = counts.get(sneaker.id);
    if (count) {
      entries.push({ sneakerId: sneaker.id, name: sneakerDisplayName(sneaker), count });
    }
  }

  entries.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return entries.slice(0, limit);
}

/** Pairs per brand, largest first. Brands past `limit` are grouped into "Other". */
export function buildBrandBreakdown(
  sneakers: AnalyticsSneaker[],
  limit = BRAND_LIMIT,
): BrandBreakdownEntry[] {
  const counts = new Map<string, number>();
  for (const sneaker of sneakers) {
    const brand = sneaker.brand.trim() || 'Unknown';
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  if (sorted.length <= limit) {
    return sorted;
  }

  const top = sorted.slice(0, limit);
  const other = sorted.slice(limit).reduce((sum, entry) => sum + entry.count, 0);
  return [...top, { label: 'Other', count: other }];
}

/** Pairs per condition in condition order (deadstock to beat), omitting empty conditions. */
export function buildConditionBreakdown(sneakers: AnalyticsSneaker[]): ConditionBreakdownEntry[] {
  return sneakerConditions
    .map((condition) => ({
      condition,
      count: sneakers.filter((sneaker) => sneaker.condition === condition).length,
    }))
    .filter((entry) => entry.count > 0);
}

/**
 * Realized gain or loss on sold pairs, kept apart from the unrealized gain on pairs still owned.
 * A sold pair without a purchase price is listed but left out of the total.
 */
export function buildRealized(sneakers: AnalyticsSneaker[]): RealizedSummary {
  const sales: RealizedSale[] = [];

  for (const sneaker of sneakers) {
    if (sneaker.departureType !== 'sold' || sneaker.salePrice == null || !sneaker.departedOn) {
      continue;
    }

    const salePrice = Number(sneaker.salePrice);
    const purchasePrice = sneaker.purchasePrice != null ? Number(sneaker.purchasePrice) : null;

    sales.push({
      sneakerId: sneaker.id,
      name: sneakerDisplayName(sneaker),
      departedOn: sneaker.departedOn,
      salePrice,
      purchasePrice,
      gainLoss: purchasePrice !== null ? Math.round((salePrice - purchasePrice) * 100) / 100 : null,
    });
  }

  sales.sort((a, b) => b.departedOn.localeCompare(a.departedOn) || a.name.localeCompare(b.name));

  const withGain = sales.filter((sale) => sale.gainLoss !== null);
  const totalGainLoss =
    withGain.length > 0
      ? Math.round(withGain.reduce((sum, sale) => sum + (sale.gainLoss ?? 0), 0) * 100) / 100
      : null;

  return { totalGainLoss, soldCount: sales.length, sales };
}

export function buildAnalytics(input: {
  sneakers: AnalyticsSneaker[];
  snapshots: AnalyticsSnapshot[];
  wears: AnalyticsWear[];
  now: Date;
}): Analytics {
  const { sneakers: allSneakers, snapshots, wears, now } = input;
  // Retired pairs only shape the value history and the realized figures. Everything else
  // describes the collection as it is today.
  const sneakers = allSneakers.filter((sneaker) => !sneaker.departureType);

  return {
    portfolioValue: buildPortfolioValue(allSneakers, snapshots),
    trackedPairs: sneakers.filter((sneaker) => sneakerKey(sneaker) !== null).length,
    totalPairs: sneakers.length,
    wearsByMonth: buildWearsByMonth(wears, now),
    mostWorn: buildMostWorn(wears, sneakers),
    brands: buildBrandBreakdown(sneakers),
    conditions: buildConditionBreakdown(sneakers),
    realized: buildRealized(allSneakers),
  };
}
