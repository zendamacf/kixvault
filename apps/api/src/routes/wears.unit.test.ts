import { describe, expect, mock, test } from 'bun:test';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

mock.module('../lib/env', () => ({
  env: { kicksdbApiKey: undefined, databaseUrl: 'postgresql://example.com/db' },
}));

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (
    c: { set: (key: 'user' | 'session', value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'user-1', email: 'user@example.com' });
    c.set('session', { id: 'session-1', fresh: false });
    await next();
  },
  requireAuth: async (_c: unknown, next: () => Promise<void>) => next(),
}));

const { wearRoutes } = await import('./wears');

function postWear(id: string, body: unknown) {
  return wearRoutes.request(`/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('wear routes', () => {
  test('POST /:sneakerId returns 400 for invalid sneaker ids', async () => {
    const response = await postWear('not-a-uuid', {});

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('POST /:sneakerId returns 400 for malformed dates', async () => {
    const response = await postWear(VALID_ID, { wornOn: 'yesterday' });

    expect(response.status).toBe(400);
  });

  test('POST /:sneakerId returns 400 for dates in the future', async () => {
    const response = await postWear(VALID_ID, { wornOn: '2999-01-01' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Wear date cannot be in the future' });
  });

  test('DELETE /:sneakerId/:date returns 400 for invalid sneaker ids', async () => {
    const response = await wearRoutes.request('/not-a-uuid/2026-11-09', { method: 'DELETE' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid sneaker id' });
  });

  test('DELETE /:sneakerId/:date returns 400 for invalid dates', async () => {
    const response = await wearRoutes.request(`/${VALID_ID}/not-a-date`, { method: 'DELETE' });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid date' });
  });

  test('GET / returns 400 without a date range', async () => {
    const response = await wearRoutes.request('/');

    expect(response.status).toBe(400);
  });

  test('GET / returns 400 for ranges over the limit', async () => {
    const response = await wearRoutes.request('/?from=2026-01-01&to=2026-12-31');

    expect(response.status).toBe(400);
  });
});
