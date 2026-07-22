import { zValidator } from '@hono/zod-validator';
import { catalogProductParamsSchema, catalogSearchQuerySchema } from '@kixvault/shared';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { CatalogProductNotFoundError, CatalogSearchError, searchCatalog } from '../lib/catalog';
import { isKicksdbConfigured } from '../lib/kicksdb';
import { fetchAndCacheCatalogProductWithPrices } from '../lib/pricing';
import { catalogSearchRateLimit } from '../middleware/catalog-rate-limit';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const catalogRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .use(catalogSearchRateLimit)
  .get('/search', zValidator('query', catalogSearchQuerySchema), async (c) => {
    if (!isKicksdbConfigured()) {
      return c.json({ error: 'Catalog search is not configured' }, 503);
    }

    const { q, limit } = c.req.valid('query');

    try {
      const results = await searchCatalog(q, limit);
      return c.json({ results });
    } catch (error) {
      if (error instanceof CatalogSearchError) {
        const status =
          error.status >= 400 && error.status < 600 ? (error.status as ContentfulStatusCode) : 502;

        return c.json({ error: 'Catalog search failed' }, status);
      }

      return c.json({ error: 'Catalog search failed' }, 502);
    }
  })
  .get('/products/:catalogId', zValidator('param', catalogProductParamsSchema), async (c) => {
    if (!isKicksdbConfigured()) {
      return c.json({ error: 'Catalog is not configured' }, 503);
    }

    const { catalogId } = c.req.valid('param');

    try {
      const { product, variantPrices } = await fetchAndCacheCatalogProductWithPrices(
        'kicksdb:stockx',
        catalogId,
      );

      return c.json({ product, variantPrices });
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
  });
