import { describe, expect, mock, test } from 'bun:test';
import { Hono } from 'hono';
import type { ApiEnv } from '../types';

const mockSetUser = mock(() => {});

const mockValidateSession = mock(async (sessionId: string) => {
  if (sessionId === 'valid-session') {
    return {
      session: { id: 'valid-session', fresh: false },
      user: { id: 'user-1', email: 'user@example.com' },
    };
  }

  return { session: null, user: null };
});

mock.module('@sentry/bun', () => ({
  setUser: mockSetUser,
}));

mock.module('../lib/env', () => ({
  env: {
    isProduction: true,
  },
}));

mock.module('../lib/auth', () => ({
  lucia: {
    sessionCookieName: 'auth_session',
    validateSession: mockValidateSession,
    createSessionCookie: (sessionId: string) => ({
      serialize: () => `auth_session=${sessionId}; Path=/; HttpOnly`,
    }),
    createBlankSessionCookie: () => ({
      serialize: () => 'auth_session=; Path=/; HttpOnly',
    }),
  },
}));

const { requireAuth, sessionMiddleware } = await import('./session');

function createApp() {
  const app = new Hono<ApiEnv>();

  app.use(sessionMiddleware);
  app.use('/protected', requireAuth);
  app.get('/protected', (c) => c.json({ ok: true }));
  app.get('/public', (c) =>
    c.json({
      user: c.get('user'),
      session: c.get('session'),
    }),
  );

  return app;
}

describe('sessionMiddleware', () => {
  test('sets null user and session when no cookie is present', async () => {
    mockSetUser.mockClear();

    const app = createApp();
    const response = await app.request('/public');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: null,
      session: null,
    });
    expect(mockSetUser).toHaveBeenCalledWith(null);
  });

  test('hydrates user and session from a valid cookie', async () => {
    mockSetUser.mockClear();

    const app = createApp();
    const response = await app.request('/public', {
      headers: { Cookie: 'auth_session=valid-session' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: { id: 'user-1', email: 'user@example.com' },
      session: { id: 'valid-session', fresh: false },
    });
    expect(mockSetUser).toHaveBeenCalledWith({ id: 'user-1' });
  });
});

describe('requireAuth', () => {
  test('returns 401 when user is not authenticated', async () => {
    const app = createApp();
    const response = await app.request('/protected');

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  test('allows authenticated requests through', async () => {
    const app = createApp();
    const response = await app.request('/protected', {
      headers: { Cookie: 'auth_session=valid-session' },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
