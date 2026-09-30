import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { resetRateLimitStoreForTests } from '../lib/rate-limit-store';
import type { ApiEnv } from '../types';
import { createRateLimitMiddleware } from './rate-limit';

describe('createRateLimitMiddleware', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  test('returns 401 when a key is required but missing', async () => {
    const limiter = createRateLimitMiddleware({
      keyPrefix: 'test:required',
      maxRequests: 5,
      windowMs: 60_000,
      resolveKey: () => null,
      requireKey: true,
    });

    const app = new Hono<ApiEnv>().use(limiter).get('/protected', (c) => c.json({ ok: true }));
    const response = await app.request('/protected');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('skips limiting when no key is resolved and requireKey is false', async () => {
    const limiter = createRateLimitMiddleware({
      keyPrefix: 'test:optional',
      maxRequests: 1,
      windowMs: 60_000,
      resolveKey: () => null,
    });

    const app = new Hono<ApiEnv>().use(limiter).get('/open', (c) => c.json({ ok: true }));

    const first = await app.request('/open');
    const second = await app.request('/open');

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });
});
