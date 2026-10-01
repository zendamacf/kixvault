import { beforeEach, describe, expect, mock, test } from 'bun:test';

const VALID_ID = '11111111-1111-4111-8111-111111111111';

const existingItem = {
  id: VALID_ID,
  userId: 'user-1',
  brand: 'Nike',
  model: 'Dunk Low',
  colorway: 'Panda',
  targetSize: 10,
  priority: 'medium' as const,
  notes: 'Original',
};

const mockListWishlistItemsForUser = mock(async () => []);
const mockGetWishlistItemForUser = mock(async () => null as typeof existingItem | null);
const mockBuildWishlistUpdate = mock(() => ({}));
const mockUpdateReturning = mock(async () => [] as Array<typeof existingItem>);

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

mock.module('../lib/wishlist', () => ({
  listWishlistItemsForUser: mockListWishlistItemsForUser,
  formatWishlistItem: (row: unknown) => row,
  parseWishlistId: (value: string) => (/^[0-9a-f-]{36}$/i.test(value) ? value : null),
  getWishlistItemForUser: mockGetWishlistItemForUser,
  buildWishlistUpdate: mockBuildWishlistUpdate,
  moveWishlistItemToCollection: mock(async () => ({})),
  CatalogProductNotFoundError: class extends Error {},
  CatalogSearchError: class extends Error {
    status = 502;
  },
}));

mock.module('../lib/db', () => ({
  db: {
    insert: () => ({ values: () => ({ returning: async () => [] }) }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: mockUpdateReturning,
        }),
      }),
    }),
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
  beforeEach(() => {
    mockGetWishlistItemForUser.mockClear();
    mockBuildWishlistUpdate.mockClear();
    mockUpdateReturning.mockClear();
  });

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

  test('PATCH /:id returns 400 for invalid ids', async () => {
    const response = await wishlistRoutes.request('/not-a-uuid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'high' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid wishlist item id' });
    expect(mockGetWishlistItemForUser).not.toHaveBeenCalled();
  });

  test('PATCH /:id returns 404 when the item is missing', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(null);

    const response = await wishlistRoutes.request(`/${VALID_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'high' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'Wishlist item not found' });
    expect(mockGetWishlistItemForUser).toHaveBeenCalledWith('user-1', VALID_ID);
  });

  test('PATCH /:id returns the existing item when there are no updates', async () => {
    mockGetWishlistItemForUser.mockResolvedValueOnce(existingItem);
    mockBuildWishlistUpdate.mockReturnValueOnce({});

    const response = await wishlistRoutes.request(`/${VALID_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ item: existingItem });
    expect(mockUpdateReturning).not.toHaveBeenCalled();
  });

  test('PATCH /:id persists updates and returns the updated item', async () => {
    const updatedItem = { ...existingItem, priority: 'high' as const, notes: 'Updated' };
    mockGetWishlistItemForUser.mockResolvedValueOnce(existingItem);
    mockBuildWishlistUpdate.mockReturnValueOnce({ priority: 'high', notes: 'Updated' });
    mockUpdateReturning.mockResolvedValueOnce([updatedItem]);

    const response = await wishlistRoutes.request(`/${VALID_ID}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'high', notes: 'Updated' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ item: updatedItem });
    expect(mockBuildWishlistUpdate).toHaveBeenCalledWith(existingItem, {
      priority: 'high',
      notes: 'Updated',
    });
    expect(mockUpdateReturning).toHaveBeenCalled();
  });
});
