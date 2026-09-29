import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { resetRateLimitStoreForTests } from '../lib/rate-limit-store';
import type { ApiEnv } from '../types';
import { authRateLimit } from './auth-rate-limit';

function createTestApp() {
  return new Hono<ApiEnv>()
    .use(authRateLimit)
    .post('/login', (c) => c.json({ ok: true }));
}

describe('authRateLimit', () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  afterEach(() => {
    resetRateLimitStoreForTests();
  });

  test('returns 429 when the auth limit is exceeded', async () => {
    const app = createTestApp();

    for (let index = 0; index < 20; index += 1) {
      const response = await app.request('/login', { method: 'POST' });
      expect(response.status).toBe(200);
    }

    const response = await app.request('/login', { method: 'POST' });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
    await expect(response.json()).resolves.toEqual({ error: 'Too many requests' });
  });
});
