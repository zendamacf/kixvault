import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { CreateSneakerFromCatalogInput, CreateSneakerInput } from '@kixvault/shared';
import type { app as AppType } from '../app';
import {
  getSessionCookie,
  getTestDatabaseUrl,
  prepareTestDatabase,
  registerTestUser,
  resetDatabase,
} from '../test/helpers';
import {
  mockEnsureKicksdbClient,
  mockGetStockxProduct,
  mockIsKicksdbConfigured,
  mockKicksdbSdk,
  resetKicksdbSdkMocks,
} from '../test/mocks/kicksdb';

mockKicksdbSdk();

mock.module('../lib/kicksdb', () => ({
  isKicksdbConfigured: mockIsKicksdbConfigured,
  ensureKicksdbClient: mockEnsureKicksdbClient,
  resetKicksdbClientForTests: () => {},
}));

const testDatabaseUrl = getTestDatabaseUrl();

describe.skipIf(!testDatabaseUrl)('API integration', () => {
  let app: typeof AppType;
  let connectionString = '';

  beforeAll(async () => {
    if (!testDatabaseUrl) {
      return;
    }

    connectionString = testDatabaseUrl;
    await prepareTestDatabase(connectionString);
    process.env.DATABASE_URL = connectionString;

    const appModule = await import('../app');
    app = appModule.app;
  });

  beforeEach(async () => {
    resetKicksdbSdkMocks();
    await resetDatabase(connectionString);
  });

  afterAll(async () => {
    if (connectionString) {
      await resetDatabase(connectionString);
    }
  });

  test('GET /api/health returns ok', async () => {
    const response = await app.request('/api/health');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      app: 'KixVault',
    });
  });

  test('POST /api/auth/register creates a user and session', async () => {
    const email = `user-${crypto.randomUUID()}@example.com`;
    const { response, cookie } = await registerTestUser(app, email);

    expect(response.status).toBe(201);
    expect(cookie).toContain('auth_session=');

    const body = (await response.json()) as { user: { email: string } };
    expect(body.user.email).toBe(email);
  });

  test('POST /api/auth/register rejects duplicate emails', async () => {
    const email = `duplicate-${crypto.randomUUID()}@example.com`;
    await registerTestUser(app, email);

    const { response } = await registerTestUser(app, email);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: 'Email already in use' });
  });

  test('GET /api/auth/me returns null without a session', async () => {
    const response = await app.request('/api/auth/me');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  test('GET /api/sneakers requires authentication', async () => {
    const response = await app.request('/api/sneakers');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('POST /api/sneakers/from-catalog creates a sneaker from a catalog product', async () => {
    mockIsKicksdbConfigured.mockReturnValue(true);
    mockGetStockxProduct.mockImplementation(() =>
      Promise.resolve({
        data: {
          data: {
            slug: '1234567890',
            title: 'Nike Air Max 1',
            brand: 'Nike',
            model: 'Air Max 1',
            primary_title: 'Nike Air Max 1',
            secondary_title: 'Big Bubble',
            sku: '319986-171',
            image: null,
            gallery: [],
            traits: [],
          },
        },
        error: null,
        response: { status: 200 },
      }),
    );

    const email = `catalog-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const input: CreateSneakerFromCatalogInput = {
      catalogSource: 'kicksdb:stockx',
      catalogId: '1234567890',
      size: 10,
      condition: 'deadstock',
    };

    const response = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    expect(response.status).toBe(201);

    const created = (await response.json()) as {
      sneaker: { id: string; brand: string; sku: string; nickname: string | null };
    };
    expect(created.sneaker.nickname).toBe('Big Bubble');
  });

  test('POST /api/sneakers/from-catalog returns 400 for invalid catalog product', async () => {
    const email = `catalog-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/sneakers/from-catalog', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(400);
  });

  test('POST /api/sneakers/custom creates a sneaker from custom input', async () => {
    const email = `custom-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const input: CreateSneakerInput = {
      brand: 'Nike',
      model: 'Air Force 1',
      colorway: 'White',
      size: 10,
      condition: 'deadstock',
      nickname: 'Big Bubble',
    };

    const response = await app.request('/api/sneakers/custom', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    expect(response.status).toBe(201);

    const created = (await response.json()) as {
      sneaker: { id: string; brand: string; sku: string; nickname: string | null };
    };
    expect(created.sneaker.nickname).toBe('Big Bubble');
  });

  test('POST /api/sneakers/custom returns 400 for invalid custom input', async () => {
    const email = `custom-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/sneakers/custom', {
      method: 'POST',
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(400);
  });

  test('POST /api/auth/login validates credentials', async () => {
    const email = `login-${crypto.randomUUID()}@example.com`;
    const password = 'password123';
    await registerTestUser(app, email, password);

    const validLogin = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    expect(validLogin.status).toBe(200);
    expect(getSessionCookie(validLogin)).toContain('auth_session=');

    const invalidLogin = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'wrong-password' }),
    });

    expect(invalidLogin.status).toBe(401);
    await expect(invalidLogin.json()).resolves.toEqual({ error: 'Invalid email or password' });
  });

  test('GET /api/catalog/search returns 503 when KicksDB is not configured', async () => {
    const email = `catalog-${crypto.randomUUID()}@example.com`;
    const { cookie } = await registerTestUser(app, email);

    const response = await app.request('/api/catalog/search?q=jordan&limit=10&marketplace=stockx', {
      headers: { Cookie: cookie },
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ error: 'Catalog search is not configured' });
  });
});
