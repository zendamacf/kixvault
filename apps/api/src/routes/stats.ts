import { sneakers } from '@kixvault/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
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
      .where(eq(sneakers.userId, user?.id ?? ''));

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
  });
