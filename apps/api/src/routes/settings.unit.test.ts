import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockWhere = mock(async () => undefined);
const mockSet = mock((_values: unknown) => ({ where: mockWhere }));
const mockGetStoredRates = mock(async () => ({
  base: 'USD' as const,
  rates: { USD: 1, EUR: 0.9 },
  updatedAt: '2026-11-18T04:00:00.000Z',
}));

mock.module('../lib/env', () => ({
  env: { databaseUrl: 'postgresql://example.com/db', port: 3000, isProduction: false },
}));
mock.module('../lib/db', () => ({ db: { update: () => ({ set: mockSet }) } }));
mock.module('../lib/exchange-rates', () => ({ getStoredRates: mockGetStoredRates }));
mock.module('../middleware/session', () => ({
  sessionMiddleware: async (
    c: { set: (key: 'user' | 'session', value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'user-1', email: 'user@example.com', currency: 'USD' });
    c.set('session', { id: 'session-1', fresh: false });
    await next();
  },
  requireAuth: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

const { settingsRoutes } = await import('./settings');

function patch(body: unknown) {
  return settingsRoutes.request('/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('settings routes', () => {
  beforeEach(() => {
    mockSet.mockClear();
  });

  test('updates currency when a rate exists', async () => {
    const res = await patch({ currency: 'EUR' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ currency: 'EUR' });
    expect(mockSet).toHaveBeenCalledWith({ currency: 'EUR' });
  });

  test('always allows USD without a stored rate', async () => {
    mockGetStoredRates.mockResolvedValueOnce({ base: 'USD', rates: { USD: 1 }, updatedAt: null });

    expect((await patch({ currency: 'USD' })).status).toBe(200);
  });

  test('rejects a currency with no stored rate', async () => {
    const res = await patch({ currency: 'GBP' });

    expect(res.status).toBe(422);
    expect(mockSet).not.toHaveBeenCalled();
  });

  test('rejects unsupported codes', async () => {
    expect((await patch({ currency: 'XXX' })).status).toBe(400);
  });

  test('returns stored rates', async () => {
    const res = await settingsRoutes.request('/exchange-rates');

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ base: 'USD', rates: { EUR: 0.9 } });
  });
});
