import { describe, expect, mock, test } from 'bun:test';

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (
    c: { set: (key: 'user' | 'session', value: unknown) => void },
    next: () => Promise<void>,
  ) => {
    c.set('user', { id: 'user-1', email: 'user@example.com' });
    c.set('session', { id: 'session-1', fresh: false });
    await next();
  },
  requireAuth: async (c: { get: (key: 'user') => unknown }, next: () => Promise<void>) => {
    if (!c.get('user')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    await next();
  },
}));

const mockListWishlistItemsForUser = mock(async () => []);

mock.module('../lib/wishlist', () => ({
  listWishlistItemsForUser: mockListWishlistItemsForUser,
  formatWishlistItem: (row: unknown) => row,
  parseWishlistId: (value: string) => (/^[0-9a-f-]{36}$/i.test(value) ? value : null),
  getWishlistItemForUser: mock(async () => null),
  buildWishlistUpdate: () => ({}),
  moveWishlistItemToCollection: mock(async () => ({})),
  CatalogProductNotFoundError: class extends Error {},
  CatalogSearchError: class extends Error {
    status = 502;
  },
}));

mock.module('../lib/db', () => ({
  db: {
    insert: () => ({ values: () => ({ returning: async () => [] }) }),
    update: () => ({ set: () => ({ where: () => ({ returning: async () => [] }) }) }),
    delete: () => ({ where: () => ({ returning: async () => [] }) }),
  },
}));

mock.module('../lib/env', () => ({
  env: { kicksdbApiKey: undefined, databaseUrl: 'postgresql://example.com/db' },
}));

mock.module('../lib/kicksdb', () => ({
  isKicksdbConfigured: () => false,
  ensureKicksdbClient: () => {},
  resetKicksdbClientForTests: () => {},
}));

mock.module('../middleware/catalog-rate-limit', () => ({
  catalogFromCatalogRateLimit: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  resetRateLimitersForTests: () => {},
}));

const { wishlistRoutes } = await import('./wishlist');

describe('wishlist routes', () => {
  test('GET / returns wishlist items', async () => {
    mockListWishlistItemsForUser.mockResolvedValueOnce([]);

    const response = await wishlistRoutes.request('/');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [] });
  });

  test('GET /:id returns 400 for invalid ids', async () => {
    const response = await wishlistRoutes.request('/not-a-uuid');

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid wishlist item id' });
  });
});
