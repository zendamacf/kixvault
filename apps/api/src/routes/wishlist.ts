import { zValidator } from '@hono/zod-validator';
import { wishlistItems } from '@kixvault/db';
import {
  createWishlistFromCatalogSchema,
  createWishlistItemSchema,
  moveWishlistToCollectionSchema,
  updateWishlistItemSchema,
} from '@kixvault/shared';
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { fetchCatalogProduct } from '../lib/catalog';
import { formatSneakerAuditMetadata, recordAuditEvent, recordSneakerCreatedAuditEvent } from '../lib/audit';
import { db } from '../lib/db';
import { getRequestClientIp } from '../lib/client-ip';
import { isKicksdbConfigured } from '../lib/kicksdb';
import { parsePurchaseDate } from '../lib/sneakers';
import {
  buildWishlistUpdate,
  CatalogProductNotFoundError,
  CatalogSearchError,
  formatWishlistItem,
  getWishlistItemForUser,
  listWishlistItemsForUser,
  moveWishlistItemToCollection,
  parseWishlistId,
} from '../lib/wishlist';
import { catalogFromCatalogRateLimit } from '../middleware/catalog-rate-limit';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const wishlistRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/', async (c) => {
    const user = c.get('user');
    const items = await listWishlistItemsForUser(user?.id ?? '');

    return c.json({ items });
  })
  .post(
    '/from-catalog',
    catalogFromCatalogRateLimit,
    zValidator('json', createWishlistFromCatalogSchema),
    async (c) => {
      if (!isKicksdbConfigured()) {
        return c.json({ error: 'Catalog is not configured' }, 503);
      }

      const user = c.get('user');
      const input = c.req.valid('json');

      try {
        const catalogProduct = await fetchCatalogProduct(input.catalogSource, input.catalogId);

        const [row] = await db
          .insert(wishlistItems)
          .values({
            userId: user?.id ?? '',
            brand: catalogProduct.brand,
            model: catalogProduct.model,
            colorway: catalogProduct.colorway,
            nickname: catalogProduct.nickname,
            priority: input.priority,
            notes: input.notes ?? null,
            sku: catalogProduct.sku,
            catalogSource: catalogProduct.catalogSource,
            catalogId: catalogProduct.catalogId,
            releaseDate: parsePurchaseDate(catalogProduct.releaseDate),
            description: catalogProduct.description,
            imageUrl: catalogProduct.imageUrl,
          })
          .returning();

        await recordAuditEvent({
          userId: user?.id ?? '',
          action: 'grail.added',
          resourceType: 'grail',
          resourceId: row.id,
          metadata: formatSneakerAuditMetadata(row),
          ip: getRequestClientIp(c),
        });

        return c.json({ item: formatWishlistItem(row) }, 201);
      } catch (error) {
        if (error instanceof CatalogProductNotFoundError) {
          return c.json({ error: error.message }, 404);
        }

        if (error instanceof CatalogSearchError) {
          const status =
            error.status >= 400 && error.status < 600
              ? (error.status as ContentfulStatusCode)
              : 502;

          return c.json({ error: 'Failed to fetch catalog product' }, status);
        }

        throw error;
      }
    },
  )
  .post('/custom', zValidator('json', createWishlistItemSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');

    const [row] = await db
      .insert(wishlistItems)
      .values({
        userId: user?.id ?? '',
        brand: input.brand,
        model: input.model,
        colorway: input.colorway ?? null,
        priority: input.priority,
        notes: input.notes ?? null,
        sku: input.sku ?? null,
        catalogSource: input.catalogSource ?? null,
        catalogId: input.catalogId ?? null,
        nickname: input.nickname ?? null,
        releaseDate: parsePurchaseDate(input.releaseDate),
        description: input.description ?? null,
        imageUrl: input.imageUrl ?? null,
      })
      .returning();

    await recordAuditEvent({
      userId: user?.id ?? '',
      action: 'grail.added',
      resourceType: 'grail',
      resourceId: row.id,
      metadata: formatSneakerAuditMetadata(row),
      ip: getRequestClientIp(c),
    });

    return c.json({ item: formatWishlistItem(row) }, 201);
  })
  .get('/:id', async (c) => {
    const user = c.get('user');
    const id = parseWishlistId(c.req.param('id'));

    if (!id) {
      return c.json({ error: 'Invalid wishlist item id' }, 400);
    }

    const row = await getWishlistItemForUser(user?.id ?? '', id);

    if (!row) {
      return c.json({ error: 'Wishlist item not found' }, 404);
    }

    return c.json({ item: formatWishlistItem(row) });
  })
  .patch('/:id', zValidator('json', updateWishlistItemSchema), async (c) => {
    const user = c.get('user');
    const id = parseWishlistId(c.req.param('id'));
    const input = c.req.valid('json');

    if (!id) {
      return c.json({ error: 'Invalid wishlist item id' }, 400);
    }

    const existing = await getWishlistItemForUser(user?.id ?? '', id);

    if (!existing) {
      return c.json({ error: 'Wishlist item not found' }, 404);
    }

    const updates = buildWishlistUpdate(existing, input);

    if (Object.keys(updates).length === 0) {
      return c.json({ item: formatWishlistItem(existing) });
    }

    const [row] = await db
      .update(wishlistItems)
      .set(updates)
      .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, user?.id ?? '')))
      .returning();

    return c.json({ item: formatWishlistItem(row) });
  })
  .delete('/:id', async (c) => {
    const user = c.get('user');
    const id = parseWishlistId(c.req.param('id'));

    if (!id) {
      return c.json({ error: 'Invalid wishlist item id' }, 400);
    }

    const [row] = await db
      .delete(wishlistItems)
      .where(and(eq(wishlistItems.id, id), eq(wishlistItems.userId, user?.id ?? '')))
      .returning({ id: wishlistItems.id });

    if (!row) {
      return c.json({ error: 'Wishlist item not found' }, 404);
    }

    return c.json({ success: true });
  })
  .post(
    '/:id/move-to-collection',
    zValidator('json', moveWishlistToCollectionSchema),
    async (c) => {
      const user = c.get('user');
      const id = parseWishlistId(c.req.param('id'));
      const input = c.req.valid('json');

      if (!id) {
        return c.json({ error: 'Invalid wishlist item id' }, 400);
      }

      const existing = await getWishlistItemForUser(user?.id ?? '', id);

      if (!existing) {
        return c.json({ error: 'Wishlist item not found' }, 404);
      }

      try {
        const sneaker = await moveWishlistItemToCollection(user?.id ?? '', existing, input);

        await recordSneakerCreatedAuditEvent({
          userId: user?.id ?? '',
          sneaker: { id: sneaker.id, brand: sneaker.brand, model: sneaker.model },
          clearedGrails: [{ brand: existing.brand, model: existing.model }],
          ip: getRequestClientIp(c),
        });

        return c.json({ sneaker }, 201);
      } catch (error) {
        if (error instanceof CatalogProductNotFoundError) {
          return c.json({ error: error.message }, 404);
        }

        if (error instanceof CatalogSearchError) {
          const status =
            error.status >= 400 && error.status < 600
              ? (error.status as ContentfulStatusCode)
              : 502;

          return c.json({ error: 'Failed to fetch catalog product' }, status);
        }

        throw error;
      }
    },
  );
