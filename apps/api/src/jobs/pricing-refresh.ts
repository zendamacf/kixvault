import { pricingRefreshRuns, sneakers } from '@kixvault/db';
import type { CatalogSource } from '@kixvault/shared';
import { and, desc, eq, gte, isNotNull } from 'drizzle-orm';
import { db } from '../lib/db';
import { env } from '../lib/env';
import { isKicksdbConfigured } from '../lib/kicksdb';
import {
  matchVariantPrice,
  refreshCatalogProductWithPrices,
  storeMarketPriceAndSnapshot,
} from '../lib/pricing';
import {
  dedupeCatalogProducts,
  getWeekStartUtc,
  hasCompletedRefreshThisWeek,
  type PriceableSneakerRow,
} from './pricing-refresh-helpers';

export type { PriceableSneakerRow } from './pricing-refresh-helpers';
export {
  dedupeCatalogProducts,
  getWeekStartUtc,
  hasCompletedRefreshThisWeek,
} from './pricing-refresh-helpers';

export type PricingRefreshResult =
  | { status: 'skipped'; reason: 'already_completed' | 'kicksdb_not_configured' | 'no_sneakers' }
  | { status: 'completed'; productsRefreshed: number; sneakersUpdated: number };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function loadPriceableSneakers(): Promise<PriceableSneakerRow[]> {
  const rows = await db
    .select({
      catalogSource: sneakers.catalogSource,
      catalogId: sneakers.catalogId,
      sku: sneakers.sku,
      size: sneakers.size,
    })
    .from(sneakers)
    .where(
      and(
        isNotNull(sneakers.catalogSource),
        isNotNull(sneakers.catalogId),
        isNotNull(sneakers.sku),
      ),
    );

  return rows.map((row) => ({
    catalogSource: row.catalogSource as CatalogSource,
    catalogId: row.catalogId as string,
    sku: row.sku as string,
    size: row.size,
  }));
}

async function hasCompletedRefreshForWeek(now: Date): Promise<boolean> {
  const weekStart = getWeekStartUtc(now);
  const completedRuns = await db
    .select({ startedAt: pricingRefreshRuns.startedAt })
    .from(pricingRefreshRuns)
    .where(
      and(eq(pricingRefreshRuns.status, 'completed'), gte(pricingRefreshRuns.startedAt, weekStart)),
    )
    .orderBy(desc(pricingRefreshRuns.startedAt));

  return hasCompletedRefreshThisWeek(completedRuns, now);
}

/** Refreshes catalog market prices for all priceable sneakers. */
export async function runPricingRefresh(): Promise<PricingRefreshResult> {
  if (!isKicksdbConfigured()) {
    return { status: 'skipped', reason: 'kicksdb_not_configured' };
  }

  const now = new Date();

  if (await hasCompletedRefreshForWeek(now)) {
    return { status: 'skipped', reason: 'already_completed' };
  }

  const priceableSneakers = await loadPriceableSneakers();

  if (priceableSneakers.length === 0) {
    return { status: 'skipped', reason: 'no_sneakers' };
  }

  const [run] = await db
    .insert(pricingRefreshRuns)
    .values({
      startedAt: now,
      status: 'running',
    })
    .returning({ id: pricingRefreshRuns.id });

  if (!run) {
    throw new Error('Failed to create pricing refresh run');
  }

  const uniqueProducts = dedupeCatalogProducts(priceableSneakers);
  const productPrices = new Map<
    string,
    Awaited<ReturnType<typeof refreshCatalogProductWithPrices>>
  >();

  try {
    let index = 0;

    for (const [productKey, product] of uniqueProducts) {
      if (index > 0 && env.pricingRefreshDelayMs > 0) {
        await sleep(env.pricingRefreshDelayMs);
      }

      const refreshed = await refreshCatalogProductWithPrices(
        product.catalogSource,
        product.catalogId,
      );
      productPrices.set(productKey, refreshed);
      index += 1;
    }

    let sneakersUpdated = 0;

    for (const sneaker of priceableSneakers) {
      const productKey = `${sneaker.catalogSource}:${sneaker.catalogId}`;
      const productWithPrices = productPrices.get(productKey);

      if (!productWithPrices) {
        continue;
      }

      const matchedPrice = matchVariantPrice(Number(sneaker.size), productWithPrices.variantPrices);

      if (!matchedPrice) {
        continue;
      }

      await storeMarketPriceAndSnapshot({
        catalogSource: sneaker.catalogSource,
        sku: sneaker.sku,
        size: Number(sneaker.size),
        price: matchedPrice.price,
        variantId: matchedPrice.variantId,
      });
      sneakersUpdated += 1;
    }

    await db
      .update(pricingRefreshRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        productsRefreshed: uniqueProducts.size,
      })
      .where(eq(pricingRefreshRuns.id, run.id));

    return {
      status: 'completed',
      productsRefreshed: uniqueProducts.size,
      sneakersUpdated,
    };
  } catch (error) {
    await db
      .update(pricingRefreshRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
      })
      .where(eq(pricingRefreshRuns.id, run.id));

    throw error;
  }
}

if (import.meta.main) {
  runPricingRefresh()
    .then((result) => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
