import { zValidator } from '@hono/zod-validator';
import { users } from '@kixvault/db';
import { BASE_CURRENCY, updateSettingsSchema } from '@kixvault/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { db } from '../lib/db';
import { getStoredRates } from '../lib/exchange-rates';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const settingsRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/exchange-rates', async (c) => c.json(await getStoredRates()))
  .patch('/', zValidator('json', updateSettingsSchema), async (c) => {
    const user = c.get('user');
    const { currency } = c.req.valid('json');

    if (currency !== BASE_CURRENCY) {
      const { rates } = await getStoredRates();
      if (!rates[currency]) {
        return c.json({ error: 'Exchange rate unavailable for that currency' }, 422);
      }
    }

    await db
      .update(users)
      .set({ currency })
      .where(eq(users.id, user?.id ?? ''));

    return c.json({ currency });
  });
