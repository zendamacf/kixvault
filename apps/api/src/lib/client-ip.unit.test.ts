import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import type { ApiEnv } from '../types';
import { getRequestClientIp } from './client-ip';

describe('getRequestClientIp', () => {
  test('prefers the first x-forwarded-for address', async () => {
    const app = new Hono<ApiEnv>().get('/ip', (c) => c.json({ ip: getRequestClientIp(c) }));

    const response = await app.request('/ip', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    });

    await expect(response.json()).resolves.toEqual({ ip: '203.0.113.1' });
  });
});
