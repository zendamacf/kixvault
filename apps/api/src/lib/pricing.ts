import { getStockxProduct, type StockXProduct } from '@kicksdb/sdk';
import {
  type CatalogVariantPrice,
  catalogMarketPrices,
  catalogProductCache,
  priceSnapshots,
  type sneakers as sneakersTable,
} from '@kixvault/db';
import type { CatalogSearchResult, CatalogSource, VariantPrice } from '@kixvault/shared';
import { and, desc, eq, or } from 'drizzle-orm';
import {
  CatalogProductNotFoundError,
  CatalogSearchError,
  fetchCatalogProduct,
  normalizeStockxProduct,
} from './catalog';
import { db } from './db';
import { ensureKicksdbClient } from './kicksdb';

export const PRODUCT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MARKET = 'US';

type PricedVariant = {
  size?: string;
  size_type?: string;
  id?: string;
  lowest_ask?: number;
  prices?: Array<{
    price?: number;
    type?: string;
  }>;
};

export type CatalogProductWithPrices = {
  product: CatalogSearchResult;
  variantPrices: VariantPrice[];
};

export type MarketPriceRecord = {
  price: number;
  pricedAt: Date;
  currency: string;
};

export function normalizeSizeValue(size: number | string): string {
  const numericSize = typeof size === 'number' ? size : Number(size);

  if (!Number.isFinite(numericSize)) {
    return String(size).trim();
  }

  if (Number.isInteger(numericSize)) {
    return String(numericSize);
  }

  return numericSize.toFixed(1);
}

/** StockX often reports $0 when there is no ask; treat those as missing. */
export function normalizeMarketPrice(price: number | null | undefined): number | null {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  return price;
}

function getStandardVariantPrice(variant: PricedVariant): number | null {
  const standardPrice = variant.prices?.find((entry) => entry.type === 'standard')?.price;
  const fromStandard = normalizeMarketPrice(standardPrice);

  if (fromStandard !== null) {
    return fromStandard;
  }

  return normalizeMarketPrice(variant.lowest_ask);
}

export function extractVariantPrices(product: StockXProduct): VariantPrice[] {
  const variants = product.variants ?? [];
  const prices: VariantPrice[] = [];

  for (const variant of variants as PricedVariant[]) {
    if (!variant.size) {
      continue;
    }

    const price = getStandardVariantPrice(variant);

    if (price === null) {
      continue;
    }

    prices.push({
      size: variant.size,
      sizeType: variant.size_type ?? null,
      price,
      variantId: variant.id ?? null,
    });
  }

  return prices;
}

export function matchVariantPrice(
  size: number,
  variantPrices: VariantPrice[],
): VariantPrice | null {
  const normalizedSize = normalizeSizeValue(size);

  return (
    variantPrices.find((variant) => normalizeSizeValue(variant.size) === normalizedSize) ?? null
  );
}

function toDbVariantPrices(variantPrices: VariantPrice[]): CatalogVariantPrice[] {
  return variantPrices.map((variant) => ({
    size: variant.size,
    sizeType: variant.sizeType,
    price: variant.price,
    variantId: variant.variantId,
  }));
}

function fromDbVariantPrices(variantPrices: CatalogVariantPrice[]): VariantPrice[] {
  return variantPrices.map((variant) => ({
    size: variant.size,
    sizeType: variant.sizeType,
    price: variant.price,
    variantId: variant.variantId,
  }));
}

async function fetchProductWithPricesFromApi(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<CatalogProductWithPrices> {
  ensureKicksdbClient();

  if (catalogSource === 'kicksdb:stockx') {
    const { data, error, response } = await getStockxProduct({
      path: { id: catalogId },
      query: {
        market: MARKET,
        'display[traits]': true,
        'display[variants]': true,
        'display[prices]': true,
      },
    });

    if (error) {
      if (response.status === 404) {
        throw new CatalogProductNotFoundError();
      }

      throw new CatalogSearchError('KicksDB request failed', response.status);
    }

    if (!data?.data) {
      throw new CatalogProductNotFoundError();
    }

    return {
      product: normalizeStockxProduct(data.data),
      variantPrices: extractVariantPrices(data.data),
    };
  }

  throw new CatalogSearchError('Unsupported catalog source', 400);
}

async function readDbProductCache(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<VariantPrice[] | null> {
  const [cached] = await db
    .select()
    .from(catalogProductCache)
    .where(
      and(
        eq(catalogProductCache.catalogSource, catalogSource),
        eq(catalogProductCache.catalogId, catalogId),
      ),
    );

  if (!cached || cached.expiresAt <= new Date()) {
    return null;
  }

  return fromDbVariantPrices(cached.variantPrices);
}

export async function getCatalogProductWithPrices(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<CatalogProductWithPrices> {
  const cachedVariantPrices = await readDbProductCache(catalogSource, catalogId);

  if (cachedVariantPrices) {
    const product = await fetchCatalogProduct(catalogSource, catalogId);
    return { product, variantPrices: cachedVariantPrices };
  }

  const fetched = await fetchProductWithPricesFromApi(catalogSource, catalogId);
  await upsertCatalogProductCache(fetched.product, fetched.variantPrices);

  return fetched;
}

export async function fetchAndCacheCatalogProductWithPrices(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<CatalogProductWithPrices> {
  return getCatalogProductWithPrices(catalogSource, catalogId);
}

export async function refreshCatalogProductWithPrices(
  catalogSource: CatalogSource,
  catalogId: string,
): Promise<CatalogProductWithPrices> {
  const fetched = await fetchProductWithPricesFromApi(catalogSource, catalogId);
  await upsertCatalogProductCache(fetched.product, fetched.variantPrices);
  return fetched;
}

export async function upsertCatalogProductCache(
  product: CatalogSearchResult,
  variantPrices: VariantPrice[],
): Promise<void> {
  const now = new Date();

  await db
    .insert(catalogProductCache)
    .values({
      catalogSource: product.catalogSource,
      catalogId: product.catalogId,
      sku: product.sku,
      variantPrices: toDbVariantPrices(variantPrices),
      fetchedAt: now,
      expiresAt: new Date(now.getTime() + PRODUCT_CACHE_TTL_MS),
    })
    .onConflictDoUpdate({
      target: [catalogProductCache.catalogSource, catalogProductCache.catalogId],
      set: {
        sku: product.sku,
        variantPrices: toDbVariantPrices(variantPrices),
        fetchedAt: now,
        expiresAt: new Date(now.getTime() + PRODUCT_CACHE_TTL_MS),
      },
    });
}

function getSnapshotDate(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
}

export async function storeMarketPriceAndSnapshot(input: {
  catalogSource: CatalogSource;
  sku: string;
  size: number;
  price: number;
  variantId?: string | null;
  currency?: string;
}): Promise<void> {
  const price = normalizeMarketPrice(input.price);

  if (price === null) {
    return;
  }

  const now = new Date();
  const sizeValue = input.size.toString();
  const currency = input.currency ?? 'USD';

  await db
    .insert(catalogMarketPrices)
    .values({
      catalogSource: input.catalogSource,
      sku: input.sku,
      size: sizeValue,
      price: price.toString(),
      currency,
      pricedAt: now,
      variantId: input.variantId ?? null,
    })
    .onConflictDoUpdate({
      target: [
        catalogMarketPrices.catalogSource,
        catalogMarketPrices.sku,
        catalogMarketPrices.size,
      ],
      set: {
        price: price.toString(),
        currency,
        pricedAt: now,
        variantId: input.variantId ?? null,
      },
    });

  await db
    .insert(priceSnapshots)
    .values({
      catalogSource: input.catalogSource,
      sku: input.sku,
      size: sizeValue,
      snapshotDate: getSnapshotDate(),
      price: price.toString(),
      currency,
    })
    .onConflictDoNothing();
}

type SneakerRow = typeof sneakersTable.$inferSelect;

function getMarketPriceKey(row: SneakerRow): string | null {
  if (!row.catalogSource || !row.sku) {
    return null;
  }

  return `${row.catalogSource}:${row.sku}:${normalizeSizeValue(row.size)}`;
}

export async function getMarketPricesForSneakers(
  rows: SneakerRow[],
): Promise<Map<string, MarketPriceRecord>> {
  const keys = new Set<string>();
  const conditions = rows
    .map((row) => {
      if (!row.catalogSource || !row.sku) {
        return null;
      }

      const key = getMarketPriceKey(row);

      if (!key || keys.has(key)) {
        return null;
      }

      keys.add(key);

      return and(
        eq(catalogMarketPrices.catalogSource, row.catalogSource),
        eq(catalogMarketPrices.sku, row.sku),
        eq(catalogMarketPrices.size, row.size),
      );
    })
    .filter((condition): condition is NonNullable<typeof condition> => condition !== null);

  if (conditions.length === 0) {
    return new Map();
  }

  const priceRows = await db
    .select()
    .from(catalogMarketPrices)
    .where(or(...conditions));

  const prices = new Map<string, MarketPriceRecord>();

  for (const row of priceRows) {
    const price = normalizeMarketPrice(Number(row.price));

    if (price === null) {
      continue;
    }

    const key = `${row.catalogSource}:${row.sku}:${normalizeSizeValue(row.size)}`;
    prices.set(key, {
      price,
      pricedAt: row.pricedAt,
      currency: row.currency,
    });
  }

  return prices;
}

export function getMarketPriceForSneaker(
  row: SneakerRow,
  prices: Map<string, MarketPriceRecord>,
): MarketPriceRecord | null {
  const key = getMarketPriceKey(row);

  if (!key) {
    return null;
  }

  return prices.get(key) ?? null;
}

export function computeGainLoss(
  purchasePrice: string | null,
  marketPrice: number | null,
): number | null {
  const normalizedMarketPrice = normalizeMarketPrice(marketPrice);

  if (normalizedMarketPrice === null || !purchasePrice) {
    return null;
  }

  return normalizedMarketPrice - Number(purchasePrice);
}

export type PriceSnapshotEntry = {
  snapshotDate: string;
  price: number;
  currency: string;
};

export async function getPriceSnapshotsForSneaker(row: SneakerRow): Promise<PriceSnapshotEntry[]> {
  if (!row.catalogSource || !row.sku) {
    return [];
  }

  const snapshots = await db
    .select({
      snapshotDate: priceSnapshots.snapshotDate,
      price: priceSnapshots.price,
      currency: priceSnapshots.currency,
    })
    .from(priceSnapshots)
    .where(
      and(
        eq(priceSnapshots.catalogSource, row.catalogSource),
        eq(priceSnapshots.sku, row.sku),
        eq(priceSnapshots.size, row.size),
      ),
    )
    .orderBy(desc(priceSnapshots.snapshotDate));

  return snapshots.flatMap((snapshot) => {
    const price = normalizeMarketPrice(Number(snapshot.price));

    if (price === null) {
      return [];
    }

    return [
      {
        snapshotDate: snapshot.snapshotDate.toISOString().slice(0, 10),
        price,
        currency: snapshot.currency,
      },
    ];
  });
}
