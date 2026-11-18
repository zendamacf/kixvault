import { sneakers } from '@kixvault/db';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { createCsvWriter } from './csv';
import { db } from './db';
import { getMarketPriceForSneaker, getMarketPricesForSneakers } from './pricing';
import { formatPurchaseDate } from './sneakers';
import { getWearStatsForSneakerIds, type WearStats } from './wears';

type SneakerRow = typeof sneakers.$inferSelect;

/**
 * The CSV header row. The order and names are a public contract (see docs/export.md), so
 * changing them is a breaking change.
 */
export const SNEAKER_EXPORT_COLUMNS = [
  'brand',
  'model',
  'colorway',
  'nickname',
  'sku',
  'size',
  'condition',
  'purchase_price',
  'purchase_date',
  'release_date',
  'market_value',
  'market_value_currency',
  'wear_count',
  'last_worn',
  'notes',
  'added_at',
] as const;

const EXPORT_BATCH_SIZE = 500;

export const sneakerExportCsv = createCsvWriter(SNEAKER_EXPORT_COLUMNS);

export function formatExportFilename(now = new Date()): string {
  return `kixvault-export-${now.toISOString().slice(0, 10)}.csv`;
}

export function formatSneakerExportRow(
  row: SneakerRow,
  extras: { marketValue: number | null; wearStats?: WearStats },
): string {
  return sneakerExportCsv.row({
    brand: row.brand,
    model: row.model,
    colorway: row.colorway,
    nickname: row.nickname,
    sku: row.sku,
    size: Number(row.size),
    condition: row.condition,
    purchase_price: row.purchasePrice == null ? null : Number(row.purchasePrice),
    purchase_date: formatPurchaseDate(row.purchaseDate),
    release_date: formatPurchaseDate(row.releaseDate),
    market_value: extras.marketValue,
    market_value_currency: 'USD',
    wear_count: extras.wearStats?.wearCount ?? 0,
    last_worn: extras.wearStats?.lastWornOn ?? null,
    notes: row.notes,
    added_at: row.createdAt.toISOString(),
  });
}

/**
 * Yields the CSV text for a user's current collection, oldest first, one batch of rows at a
 * time so the whole collection is never held in memory. Retired pairs are not included.
 */
export async function* streamSneakerExport(userId: string): AsyncGenerator<string> {
  yield sneakerExportCsv.header();

  for (let offset = 0; ; offset += EXPORT_BATCH_SIZE) {
    const rows = await db
      .select()
      .from(sneakers)
      .where(and(eq(sneakers.userId, userId), isNull(sneakers.departureType)))
      .orderBy(asc(sneakers.createdAt), asc(sneakers.id))
      .limit(EXPORT_BATCH_SIZE)
      .offset(offset);

    if (rows.length === 0) {
      return;
    }

    const [marketPrices, wearStats] = await Promise.all([
      getMarketPricesForSneakers(rows),
      getWearStatsForSneakerIds(rows.map((row) => row.id)),
    ]);

    yield rows
      .map((row) =>
        formatSneakerExportRow(row, {
          marketValue: getMarketPriceForSneaker(row, marketPrices)?.price ?? null,
          wearStats: wearStats.get(row.id),
        }),
      )
      .join('');

    if (rows.length < EXPORT_BATCH_SIZE) {
      return;
    }
  }
}
