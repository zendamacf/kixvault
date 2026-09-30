import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { resetRateLimitStoreForTests } from '../lib/rate-limit-store';
import type { ApiEnv } from '../types';
import { globalApiRateLimit } from './global-rate-limit';

describe('globalApiRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  test('limits requests per client IP', async () => {
    const app = new Hono<ApiEnv>()
      .use(globalApiRateLimit)
      .get('/api/example', (c) => c.json({ ok: true }));

    const headers = { 'x-forwarded-for': '198.51.100.10' };

    for (let index = 0; index < 300; index += 1) {
      const response = await app.request('/api/example', { headers });
      expect(response.status).toBe(200);
    }

    const blocked = await app.request('/api/example', { headers });

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBeTruthy();
  });
});
