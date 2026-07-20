import { zValidator } from '@hono/zod-validator';
import { catalogBarcodeQuerySchema, catalogSearchQuerySchema } from '@kixvault/shared';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { CatalogSearchError, searchCatalog, searchCatalogByBarcode } from '../lib/catalog';
import { isKicksdbConfigured } from '../lib/kicksdb';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const catalogRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/search', zValidator('query', catalogSearchQuerySchema), async (c) => {
    if (!isKicksdbConfigured()) {
      return c.json({ error: 'Catalog search is not configured' }, 503);
    }

    const { q, limit, marketplace } = c.req.valid('query');

    try {
      const results = await searchCatalog(q, limit, marketplace);
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
  .get('/barcode', zValidator('query', catalogBarcodeQuerySchema), async (c) => {
    if (!isKicksdbConfigured()) {
      return c.json({ error: 'Catalog search is not configured' }, 503);
    }

    const { code, limit } = c.req.valid('query');

    try {
      const results = await searchCatalogByBarcode(code, limit);
      return c.json({ results });
    } catch (error) {
      if (error instanceof CatalogSearchError) {
        const status =
          error.status >= 400 && error.status < 600 ? (error.status as ContentfulStatusCode) : 502;

        return c.json({ error: 'Barcode lookup failed' }, status);
      }

      return c.json({ error: 'Barcode lookup failed' }, 502);
    }
  });
