import { afterEach, describe, expect, mock, test } from 'bun:test';
import { Hono } from 'hono';
import type { ApiEnv } from '../types';

const originalLogLevel = process.env.LOG_LEVEL;

const mockValidateSession = mock(async (sessionId: string) => {
  if (sessionId === 'valid-session') {
    return {
      session: { id: 'valid-session', fresh: false },
      user: { id: 'user-1', email: 'user@example.com' },
    };
  }

  return { session: null, user: null };
});

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

const { requestLogMiddleware } = await import('./request-log');
const { sessionMiddleware } = await import('./session');

function createApp() {
  const app = new Hono<ApiEnv>();

  app.use(requestLogMiddleware);
  app.use(sessionMiddleware);
  app.get('/api/health', (c) => c.json({ status: 'ok' }));
  app.get('/api/example', (c) => c.json({ ok: true }));
  app.get('/api/authenticated', (c) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({ ok: true });
  });

  return app;
}

describe('requestLogMiddleware', () => {
  afterEach(() => {
    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLogLevel;
    }
  });

  test('adds a request id response header', async () => {
    process.env.LOG_LEVEL = 'silent';

    const app = createApp();
    const response = await app.request('/api/example');

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Request-Id')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  test('reuses an incoming request id header', async () => {
    process.env.LOG_LEVEL = 'silent';

    const app = createApp();
    const response = await app.request('/api/example', {
      headers: { 'X-Request-Id': 'client-request-id' },
    });

    expect(response.headers.get('X-Request-Id')).toBe('client-request-id');
  });

  test('logs request details in plain text', async () => {
    process.env.LOG_LEVEL = 'info';

    const logSpy = mock(() => {});
    const originalLog = console.log;
    console.log = logSpy;

    try {
      const app = createApp();
      const response = await app.request('/api/example', {
        headers: { 'X-Request-Id': 'req-123' },
      });

      expect(response.status).toBe(200);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0]?.[0]).toBe('GET /api/example 200 0ms requestId=req-123');
    } finally {
      console.log = originalLog;
    }
  });

  test('includes the authenticated user id in logs', async () => {
    process.env.LOG_LEVEL = 'info';

    const logSpy = mock(() => {});
    const originalLog = console.log;
    console.log = logSpy;

    try {
      const app = createApp();
      const response = await app.request('/api/authenticated', {
        headers: {
          Cookie: 'auth_session=valid-session',
          'X-Request-Id': 'req-456',
        },
      });

      expect(response.status).toBe(200);
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy.mock.calls[0]?.[0]).toBe(
        'GET /api/authenticated 200 0ms requestId=req-456 user=user-1',
      );
    } finally {
      console.log = originalLog;
    }
  });

  test('skips logging for the health check route', async () => {
    process.env.LOG_LEVEL = 'info';

    const logSpy = mock(() => {});
    const originalLog = console.log;
    console.log = logSpy;

    try {
      const app = createApp();
      const response = await app.request('/api/health');

      expect(response.status).toBe(200);
      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      console.log = originalLog;
    }
  });

  test('does not log when LOG_LEVEL is silent', async () => {
    process.env.LOG_LEVEL = 'silent';

    const logSpy = mock(() => {});
    const originalLog = console.log;
    console.log = logSpy;

    try {
      const app = createApp();
      const response = await app.request('/api/example');

      expect(response.status).toBe(200);
      expect(logSpy).not.toHaveBeenCalled();
    } finally {
      console.log = originalLog;
    }
  });
});
