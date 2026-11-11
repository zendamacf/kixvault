import { priceSnapshots, sneakers, sneakerWears } from '@kixvault/db';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { Hono } from 'hono';
import { buildAnalytics } from '../lib/analytics';
import { computeCollectionMarketStats } from '../lib/collection-stats';
import { db } from '../lib/db';
import { getMarketPricesForSneakers } from '../lib/pricing';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const statsRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/', async (c) => {
    const user = c.get('user');

    const rows = await db
      .select()
      .from(sneakers)
      .where(and(eq(sneakers.userId, user?.id ?? ''), isNull(sneakers.departureType)));

    const count = rows.length;
    const totalSpend = rows.reduce(
      (sum, row) => sum + (row.purchasePrice ? Number(row.purchasePrice) : 0),
      0,
    );
    const marketPrices = await getMarketPricesForSneakers(rows);
    const { totalMarketValue, totalGainLoss } = computeCollectionMarketStats(rows, marketPrices);

    return c.json({
      stats: {
        count,
        totalSpend,
        avgSpend: count > 0 ? totalSpend / count : 0,
        totalMarketValue,
        totalGainLoss,
      },
    });
  })
  .get('/analytics', async (c) => {
    const userId = c.get('user')?.id ?? '';

    const rows = await db.select().from(sneakers).where(eq(sneakers.userId, userId));

    const skus = [
      ...new Set(rows.flatMap((row) => (row.catalogSource && row.sku ? [row.sku] : []))),
    ];
    const snapshotRows =
      skus.length > 0
        ? await db.select().from(priceSnapshots).where(inArray(priceSnapshots.sku, skus))
        : [];

    const wearRows = await db
      .select({ sneakerId: sneakerWears.sneakerId, wornOn: sneakerWears.wornOn })
      .from(sneakerWears)
      .where(eq(sneakerWears.userId, userId));

    const analytics = buildAnalytics({
      sneakers: rows.map((row) => ({
        id: row.id,
        brand: row.brand,
        model: row.model,
        nickname: row.nickname,
        condition: row.condition,
        size: row.size,
        sku: row.sku,
        catalogSource: row.catalogSource,
        purchaseDate: row.purchaseDate ? row.purchaseDate.toISOString().slice(0, 10) : null,
        purchasePrice: row.purchasePrice,
        departureType: row.departureType,
        departedOn: row.departedOn ? row.departedOn.toISOString().slice(0, 10) : null,
        salePrice: row.salePrice,
      })),
      snapshots: snapshotRows.map((row) => ({
        catalogSource: row.catalogSource,
        sku: row.sku,
        size: row.size,
        snapshotDate: row.snapshotDate.toISOString().slice(0, 10),
        price: row.price,
      })),
      wears: wearRows,
      now: new Date(),
    });

    return c.json({ analytics });
  });
