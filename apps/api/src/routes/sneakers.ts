import { zValidator } from '@hono/zod-validator';
import { sneakers } from '@kixvault/db';
import {
  createSneakerFromCatalogSchema,
  createSneakerSchema,
  listSneakersQuerySchema,
  updateSneakerSchema,
} from '@kixvault/shared';
import { and, asc, desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import {
  CatalogProductNotFoundError,
  CatalogSearchError,
  fetchCatalogProduct,
} from '../lib/catalog';
import { db } from '../lib/db';
import { isKicksdbConfigured } from '../lib/kicksdb';
import { catalogFromCatalogRateLimit } from '../middleware/catalog-rate-limit';
import {
  buildSneakerSearchCondition,
  buildSneakerUpdate,
  formatSneaker,
  getCatalogLinkedModelFieldViolations,
  parsePurchaseDate,
  parseSneakerId,
} from '../lib/sneakers';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const sneakerRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/', zValidator('query', listSneakersQuerySchema), async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');

    const filters = [eq(sneakers.userId, user?.id ?? '')];

    const searchCondition = query.search ? buildSneakerSearchCondition(query.search) : undefined;

    if (searchCondition) {
      filters.push(searchCondition);
    }

    if (query.condition) {
      filters.push(eq(sneakers.condition, query.condition));
    }

    const sortColumn = {
      created_at: sneakers.createdAt,
      purchase_date: sneakers.purchaseDate,
      purchase_price: sneakers.purchasePrice,
      brand: sneakers.brand,
    }[query.sort];

    const orderBy = query.order === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const rows = await db
      .select()
      .from(sneakers)
      .where(and(...filters))
      .orderBy(orderBy);

    return c.json({ sneakers: rows.map(formatSneaker) });
  })
  .post('/from-catalog', catalogFromCatalogRateLimit, zValidator('json', createSneakerFromCatalogSchema), async (c) => {
    if (!isKicksdbConfigured()) {
      return c.json({ error: 'Catalog is not configured' }, 503);
    }

    const user = c.get('user');
    const input = c.req.valid('json');

    try {
      const catalogProduct = await fetchCatalogProduct(input.catalogSource, input.catalogId);

      const [row] = await db
        .insert(sneakers)
        .values({
          userId: user?.id ?? '',
          brand: catalogProduct.brand,
          model: catalogProduct.model,
          colorway: catalogProduct.colorway,
          nickname: catalogProduct.nickname,
          size: input.size.toString(),
          condition: input.condition,
          purchasePrice: input.purchasePrice?.toString() ?? null,
          purchaseDate: parsePurchaseDate(input.purchaseDate),
          notes: input.notes ?? null,
          sku: catalogProduct.sku,
          imageUrl: catalogProduct.imageUrl,
          catalogSource: catalogProduct.catalogSource,
          catalogId: catalogProduct.catalogId,
          releaseDate: parsePurchaseDate(catalogProduct.releaseDate),
          description: catalogProduct.description,
        })
        .returning();

      return c.json({ sneaker: formatSneaker(row) }, 201);
    } catch (error) {
      if (error instanceof CatalogProductNotFoundError) {
        return c.json({ error: error.message }, 404);
      }

      if (error instanceof CatalogSearchError) {
        const status =
          error.status >= 400 && error.status < 600 ? (error.status as ContentfulStatusCode) : 502;

        return c.json({ error: 'Failed to fetch catalog product' }, status);
      }

      throw error;
    }
  })
  .get('/:id', async (c) => {
    const user = c.get('user');
    const id = parseSneakerId(c.req.param('id'));

    if (!id) {
      return c.json({ error: 'Invalid sneaker id' }, 400);
    }

    const [row] = await db
      .select()
      .from(sneakers)
      .where(and(eq(sneakers.id, id), eq(sneakers.userId, user?.id ?? '')));

    if (!row) {
      return c.json({ error: 'Sneaker not found' }, 404);
    }

    return c.json({ sneaker: formatSneaker(row) });
  })
  .post('/custom', zValidator('json', createSneakerSchema), async (c) => {
    const user = c.get('user');
    const input = c.req.valid('json');

    const [row] = await db
      .insert(sneakers)
      .values({
        userId: user?.id ?? '',
        brand: input.brand,
        model: input.model,
        colorway: input.colorway ?? null,
        nickname: input.nickname ?? null,
        size: input.size.toString(),
        condition: input.condition,
        purchasePrice: input.purchasePrice?.toString() ?? null,
        purchaseDate: parsePurchaseDate(input.purchaseDate),
        notes: input.notes ?? null,
        sku: input.sku ?? null,
        imageUrl: input.imageUrl ?? null,
        catalogSource: input.catalogSource ?? null,
        catalogId: input.catalogId ?? null,
        releaseDate: parsePurchaseDate(input.releaseDate),
        description: input.description ?? null,
      })
      .returning();

    return c.json({ sneaker: formatSneaker(row) }, 201);
  })
  .patch('/:id', zValidator('json', updateSneakerSchema), async (c) => {
    const user = c.get('user');
    const id = parseSneakerId(c.req.param('id'));
    const input = c.req.valid('json');

    if (!id) {
      return c.json({ error: 'Invalid sneaker id' }, 400);
    }

    const [existing] = await db
      .select()
      .from(sneakers)
      .where(and(eq(sneakers.id, id), eq(sneakers.userId, user?.id ?? '')));

    if (!existing) {
      return c.json({ error: 'Sneaker not found' }, 404);
    }

    const violations = getCatalogLinkedModelFieldViolations(existing, input);

    if (violations.length > 0) {
      return c.json(
        {
          error: `Cannot update ${violations.join(', ')} for catalog-linked sneakers`,
        },
        400,
      );
    }

    const updates = buildSneakerUpdate(existing, input);

    if (Object.keys(updates).length === 0) {
      return c.json({ sneaker: formatSneaker(existing) });
    }

    const [row] = await db.update(sneakers).set(updates).where(eq(sneakers.id, id)).returning();

    return c.json({ sneaker: formatSneaker(row) });
  })
  .delete('/:id', async (c) => {
    const user = c.get('user');
    const id = parseSneakerId(c.req.param('id'));

    if (!id) {
      return c.json({ error: 'Invalid sneaker id' }, 400);
    }

    const [row] = await db
      .delete(sneakers)
      .where(and(eq(sneakers.id, id), eq(sneakers.userId, user?.id ?? '')))
      .returning({ id: sneakers.id });

    if (!row) {
      return c.json({ error: 'Sneaker not found' }, 404);
    }

    return c.json({ success: true });
  });
