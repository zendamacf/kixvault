import { describe, expect, mock, test } from 'bun:test';

const mockInsert = mock(async () => undefined);
const mockSelect = mock(() => ({
  from: () => ({
    where: async () => [] as { id: string }[],
  }),
}));
const mockCreateSession = mock(async () => ({ id: 'session-1' }));
const mockCreateSessionCookie = mock(() => ({
  serialize: () => 'auth_session=session-1; Path=/',
}));

mock.module('../lib/db', () => ({
  db: {
    select: mockSelect,
    insert: () => ({
      values: mockInsert,
    }),
  },
}));

mock.module('../lib/auth', () => ({
  lucia: {
    createSession: mockCreateSession,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

function mockEnv(signupsEnabled: boolean) {
  mock.module('../lib/env', () => ({
    env: {
      signupsEnabled,
      databaseUrl: 'postgresql://example.com/db',
      kicksdbApiKey: undefined,
      port: 3000,
      isProduction: false,
      sentryDsn: '',
      sentryRelease: undefined,
    },
  }));
}

async function loadAuthRoutes() {
  const module = await import(`./auth?t=${Date.now()}`);
  return module.authRoutes;
}

describe('authRoutes register', () => {
  test('returns 403 when signups are disabled', async () => {
    mockEnv(false);
    const authRoutes = await loadAuthRoutes();

    const response = await authRoutes.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Signups are disabled' });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('creates a user when signups are enabled', async () => {
    mockEnv(true);
    const authRoutes = await loadAuthRoutes();

    const response = await authRoutes.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });

    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalled();
  });
});
