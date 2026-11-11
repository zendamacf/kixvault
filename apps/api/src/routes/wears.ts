import { zValidator } from '@hono/zod-validator';
import { sneakers, sneakerWears } from '@kixvault/db';
import { isWearDateAllowed, listWearsQuerySchema, logWearSchema } from '@kixvault/shared';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { Hono } from 'hono';
import { formatSneakerAuditMetadata, recordAuditEvent } from '../lib/audit';
import { getRequestClientIp } from '../lib/client-ip';
import { db } from '../lib/db';
import { formatPrimaryImage, getPrimaryImagesForSneakerIds } from '../lib/sneaker-images';
import { formatSneakerWithPricing, isRetired, parseSneakerId } from '../lib/sneakers';
import { logWear, removeWear, todayUtc } from '../lib/wears';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function findOwnedSneaker(userId: string, sneakerId: string) {
  const [row] = await db
    .select()
    .from(sneakers)
    .where(and(eq(sneakers.id, sneakerId), eq(sneakers.userId, userId)));

  return row;
}

export const wearRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/', zValidator('query', listWearsQuerySchema), async (c) => {
    const user = c.get('user');
    const { from, to } = c.req.valid('query');

    const rows = await db
      .select({
        id: sneakerWears.id,
        sneakerId: sneakerWears.sneakerId,
        wornOn: sneakerWears.wornOn,
        brand: sneakers.brand,
        model: sneakers.model,
        nickname: sneakers.nickname,
        colorway: sneakers.colorway,
      })
      .from(sneakerWears)
      .innerJoin(sneakers, eq(sneakers.id, sneakerWears.sneakerId))
      .where(
        and(
          eq(sneakerWears.userId, user?.id ?? ''),
          gte(sneakerWears.wornOn, from),
          lte(sneakerWears.wornOn, to),
        ),
      )
      .orderBy(asc(sneakerWears.wornOn), asc(sneakerWears.createdAt));

    const imagesBySneakerId = await getPrimaryImagesForSneakerIds([
      ...new Set(rows.map((row) => row.sneakerId)),
    ]);

    return c.json({
      wears: rows.map((row) => {
        const image = imagesBySneakerId.get(row.sneakerId);

        return {
          id: row.id,
          sneakerId: row.sneakerId,
          wornOn: row.wornOn,
          brand: row.brand,
          model: row.model,
          nickname: row.nickname,
          colorway: row.colorway,
          primaryImage: image ? formatPrimaryImage(image) : null,
        };
      }),
    });
  })
  .post('/:sneakerId', zValidator('json', logWearSchema), async (c) => {
    const user = c.get('user');
    const userId = user?.id ?? '';
    const sneakerId = parseSneakerId(c.req.param('sneakerId'));
    const { wornOn = todayUtc() } = c.req.valid('json');

    if (!sneakerId) {
      return c.json({ error: 'Invalid sneaker id' }, 400);
    }

    if (!isWearDateAllowed(wornOn)) {
      return c.json({ error: 'Wear date cannot be in the future' }, 400);
    }

    const existing = await findOwnedSneaker(userId, sneakerId);

    if (!existing) {
      return c.json({ error: 'Sneaker not found' }, 404);
    }

    if (isRetired(existing)) {
      return c.json({ error: 'Retired pairs cannot be worn' }, 409);
    }

    const result = await logWear(userId, existing, wornOn);

    if (result.created) {
      await recordAuditEvent({
        userId,
        action: 'sneaker.worn',
        resourceType: 'sneaker',
        resourceId: existing.id,
        metadata: {
          ...formatSneakerAuditMetadata(existing),
          wornOn,
          ...(result.conditionChanged ? { condition: result.sneaker.condition } : {}),
        },
        ip: getRequestClientIp(c),
      });
    }

    return c.json(
      {
        wear: result.wear,
        created: result.created,
        conditionChanged: result.conditionChanged,
        sneaker: await formatSneakerWithPricing(result.sneaker),
      },
      result.created ? 201 : 200,
    );
  })
  .delete('/:sneakerId/:date', async (c) => {
    const user = c.get('user');
    const userId = user?.id ?? '';
    const sneakerId = parseSneakerId(c.req.param('sneakerId'));
    const date = c.req.param('date');

    if (!sneakerId) {
      return c.json({ error: 'Invalid sneaker id' }, 400);
    }

    if (!DATE_PATTERN.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      return c.json({ error: 'Invalid date' }, 400);
    }

    const existing = await findOwnedSneaker(userId, sneakerId);

    if (!existing) {
      return c.json({ error: 'Sneaker not found' }, 404);
    }

    const result = await removeWear(userId, existing, date);

    if (!result.removed) {
      return c.json({ error: 'Wear not found' }, 404);
    }

    await recordAuditEvent({
      userId,
      action: 'sneaker.wear_removed',
      resourceType: 'sneaker',
      resourceId: existing.id,
      metadata: {
        ...formatSneakerAuditMetadata(existing),
        wornOn: date,
        ...(result.conditionReverted ? { condition: result.sneaker.condition } : {}),
      },
      ip: getRequestClientIp(c),
    });

    return c.json({
      success: true,
      conditionReverted: result.conditionReverted,
      sneaker: await formatSneakerWithPricing(result.sneaker),
    });
  });
