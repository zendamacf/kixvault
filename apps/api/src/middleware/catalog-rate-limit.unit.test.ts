import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import type { ApiEnv } from '../types';
import {
  catalogFromCatalogRateLimit,
  catalogSearchRateLimit,
  resetRateLimitersForTests,
} from './catalog-rate-limit';

function createTestApp(rateLimit = catalogSearchRateLimit) {
  return new Hono<ApiEnv>()
    .use(async (c, next) => {
      c.set('user', { id: 'user-1', email: 'user@example.com' });
      c.set('session', { id: 'session-1', fresh: false, userId: 'user-1', expiresAt: new Date() });
      await next();
    })
    .use(rateLimit)
    .get('/search', (c) => c.json({ ok: true }));
}

describe('catalog rate limiting', () => {
  beforeEach(() => {
    resetRateLimitersForTests();
  });

  afterEach(() => {
    resetRateLimitersForTests();
  });

  test('allows requests under the limit', async () => {
    const app = createTestApp();

    const response = await app.request('/search');

    expect(response.status).toBe(200);
  });

  test('returns 429 when the search limit is exceeded', async () => {
    const app = createTestApp();

    for (let index = 0; index < 30; index += 1) {
      const response = await app.request('/search');
      expect(response.status).toBe(200);
    }

    const response = await app.request('/search');

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
    await expect(response.json()).resolves.toEqual({ error: 'Too many requests' });
  });

  test('tracks from-catalog requests separately from search', async () => {
    const searchApp = createTestApp(catalogSearchRateLimit);
    const fromCatalogApp = new Hono<ApiEnv>()
      .use(async (c, next) => {
        c.set('user', { id: 'user-1', email: 'user@example.com' });
        c.set('session', {
          id: 'session-1',
          fresh: false,
          userId: 'user-1',
          expiresAt: new Date(),
        });
        await next();
      })
      .use(catalogFromCatalogRateLimit)
      .post('/from-catalog', (c) => c.json({ ok: true }));

    for (let index = 0; index < 20; index += 1) {
      const response = await fromCatalogApp.request('/from-catalog', { method: 'POST' });
      expect(response.status).toBe(200);
    }

    const blocked = await fromCatalogApp.request('/from-catalog', { method: 'POST' });
    const searchStillAllowed = await searchApp.request('/search');

    expect(blocked.status).toBe(429);
    expect(searchStillAllowed.status).toBe(200);
  });
});
