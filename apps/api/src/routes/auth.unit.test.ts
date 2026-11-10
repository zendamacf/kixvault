import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

const mockInsert = mock(async () => undefined);
let selectRows: Record<string, unknown>[] = [];
const mockSelect = mock(() => ({
  from: () => ({
    where: () =>
      Object.assign(Promise.resolve(selectRows), {
        limit: async () => selectRows,
      }),
  }),
}));
let claimedRows: { userId: string }[] = [];
const mockTx = {
  delete: () => ({ where: async () => undefined }),
  insert: () => ({ values: async () => undefined }),
  update: () => ({
    set: () => ({
      where: () =>
        Object.assign(Promise.resolve(undefined), { returning: async () => claimedRows }),
    }),
  }),
};
const mockInvalidateUserSessions = mock(async () => undefined);
const mockCreateSession = mock(async () => ({ id: 'session-1' }));
const mockCreateSessionCookie = mock(() => ({
  serialize: () => 'auth_session=session-1; Path=/',
}));

const mockEnv = {
  signupsEnabled: false,
  resendApiKey: undefined as string | undefined,
  emailFrom: 'KixVault <test@example.com>',
  appUrl: 'http://localhost:5173',
  databaseUrl: 'postgresql://example.com/db',
  kicksdbApiKey: undefined,
  port: 3000,
  isProduction: false,
  sentryDsn: '',
  sentryRelease: undefined,
};

mock.module('../lib/db', () => ({
  db: {
    select: mockSelect,
    insert: () => ({
      values: mockInsert,
    }),
    transaction: async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
  },
}));

mock.module('../lib/auth', () => ({
  lucia: {
    createSession: mockCreateSession,
    invalidateUserSessions: mockInvalidateUserSessions,
    createSessionCookie: mockCreateSessionCookie,
  },
}));

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
  requireAuth: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

mock.module('../lib/env', () => ({
  env: mockEnv,
}));

const { authRoutes } = await import('./auth');
const { resetRateLimitStoreForTests } = await import('../lib/rate-limit-store');

describe('authRoutes register', () => {
  beforeEach(() => {
    selectRows = [];
    mockEnv.resendApiKey = undefined;
    mockInsert.mockClear();
    mockCreateSession.mockClear();
    mockCreateSessionCookie.mockClear();
  });

  test('returns 403 when signups are disabled', async () => {
    mockEnv.signupsEnabled = false;

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
    mockEnv.signupsEnabled = true;

    const response = await authRoutes.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });

    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalled();
  });
});

const json = (body: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('authRoutes with email verification', () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let infoSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    selectRows = [];
    claimedRows = [];
    mockInsert.mockClear();
    mockCreateSession.mockClear();
    mockEnv.signupsEnabled = true;
    mockEnv.resendApiKey = 're_test';
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    infoSpy = spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mockEnv.resendApiKey = undefined;
    fetchSpy.mockRestore();
    infoSpy.mockRestore();
  });

  test('register sends a verification email and does not start a session', async () => {
    const response = await authRoutes.request(
      '/register',
      json({ email: ' User@Example.com ', password: 'password123' }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(mockCreateSession).not.toHaveBeenCalled();
    const data = await response.json();
    expect(data).toMatchObject({ requiresVerification: true, user: { email: 'user@example.com' } });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(init.body as string);
    expect(body.to).toEqual(['user@example.com']);
    expect(body.text).toContain('http://localhost:5173/verify-email?token=');
  });

  test('register still succeeds when the email cannot be sent', async () => {
    fetchSpy.mockResolvedValue(new Response('nope', { status: 500 }));
    const errorSpy = spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await authRoutes.request(
      '/register',
      json({ email: 'user@example.com', password: 'password123' }),
    );
    errorSpy.mockRestore();

    expect(response.status).toBe(201);
  });

  test('register rejects a malformed email', async () => {
    const response = await authRoutes.request(
      '/register',
      json({ email: 'user@localhost', password: 'password123' }),
    );

    expect(response.status).toBe(400);
  });

  test('login rejects an unverified account with a code the web app can act on', async () => {
    selectRows = [
      {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: await Bun.password.hash('password123'),
        emailVerifiedAt: null,
      },
    ];

    const response = await authRoutes.request(
      '/login',
      json({ email: 'user@example.com', password: 'password123' }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'email_not_verified' });
    expect(mockCreateSession).not.toHaveBeenCalled();
  });

  test('login accepts a verified account', async () => {
    selectRows = [
      {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: await Bun.password.hash('password123'),
        emailVerifiedAt: new Date(),
      },
    ];

    const response = await authRoutes.request(
      '/login',
      json({ email: 'user@example.com', password: 'password123' }),
    );

    expect(response.status).toBe(200);
  });

  test('login lets an unverified account in when email is not configured', async () => {
    mockEnv.resendApiKey = undefined;
    selectRows = [
      {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: await Bun.password.hash('password123'),
        emailVerifiedAt: null,
      },
    ];

    const response = await authRoutes.request(
      '/login',
      json({ email: 'user@example.com', password: 'password123' }),
    );

    expect(response.status).toBe(200);
  });

  test('verify-email rejects an unknown or used token', async () => {
    claimedRows = [];

    const response = await authRoutes.request('/verify-email', json({ token: 'nope' }));

    expect(response.status).toBe(400);
  });

  test('verify-email confirms a valid token and records it', async () => {
    claimedRows = [{ userId: 'user-1' }];

    const response = await authRoutes.request('/verify-email', json({ token: 'good' }));

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', action: 'auth.email_verified' }),
    );
  });

  test('resend-verification gives the same answer for an unknown account and sends nothing', async () => {
    selectRows = [];

    const response = await authRoutes.request(
      '/resend-verification',
      json({ email: 'ghost@example.com' }),
    );

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('resend-verification sends a new link to an unverified account', async () => {
    selectRows = [{ id: 'user-1', emailVerifiedAt: null, createdAt: new Date(0) }];

    const response = await authRoutes.request(
      '/resend-verification',
      json({ email: 'user@example.com' }),
    );
    await Bun.sleep(0);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('resend-verification is unavailable when email is not configured', async () => {
    mockEnv.resendApiKey = undefined;

    const response = await authRoutes.request(
      '/resend-verification',
      json({ email: 'user@example.com' }),
    );

    expect(response.status).toBe(503);
  });
});

describe('authRoutes password recovery', () => {
  let fetchSpy: ReturnType<typeof spyOn>;
  let infoSpy: ReturnType<typeof spyOn>;

  // Other test files can stub out the store reset (mock.module is global), so each test uses
  // its own client IP and addresses instead of relying on a clean store.
  let testId = 0;
  const post = (path: string, body: unknown, ip = `10.1.${testId}.1`) =>
    authRoutes.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
      body: JSON.stringify(body),
    });
  const email = (name = 'user') => `${name}-${testId}@example.com`;

  beforeEach(() => {
    testId += 1;
    resetRateLimitStoreForTests();
    selectRows = [];
    claimedRows = [];
    mockInsert.mockClear();
    mockInvalidateUserSessions.mockClear();
    mockEnv.resendApiKey = 're_test';
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    infoSpy = spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    mockEnv.resendApiKey = undefined;
    fetchSpy.mockRestore();
    infoSpy.mockRestore();
    resetRateLimitStoreForTests();
  });

  test('forgot-password answers the same for an unknown account and sends nothing', async () => {
    const response = await post('/forgot-password', { email: email('ghost') });

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('forgot-password does not send to an unverified account', async () => {
    selectRows = [{ id: 'user-1', emailVerifiedAt: null, createdAt: new Date(0) }];

    const response = await post('/forgot-password', { email: email() });
    await Bun.sleep(0);

    expect(response.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('forgot-password emails a verified account', async () => {
    selectRows = [{ id: 'user-1', emailVerifiedAt: new Date(0), createdAt: new Date(0) }];

    const response = await post('/forgot-password', { email: email() });
    await Bun.sleep(0);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  test('forgot-password is unavailable when email is not configured', async () => {
    mockEnv.resendApiKey = undefined;

    const response = await post('/forgot-password', { email: email() });

    expect(response.status).toBe(503);
  });

  test('forgot-password stops emailing one address after the per-address limit', async () => {
    selectRows = [{ id: 'user-1', emailVerifiedAt: new Date(0), createdAt: new Date(0) }];
    // Different IPs, so only the per-address limit can be what stops the fourth request.
    for (let index = 0; index < 4; index += 1) {
      const response = await post(
        '/forgot-password',
        { email: email() },
        `10.2.${testId}.${index}`,
      );
      expect(response.status).toBe(200);
    }
    await Bun.sleep(0);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  test('forgot-password returns 429 after 5 requests per IP in an hour', async () => {
    for (let index = 0; index < 5; index += 1) {
      const response = await post('/forgot-password', { email: email(`user${index}`) });
      expect(response.status).toBe(200);
    }

    const response = await post('/forgot-password', { email: email('another') });

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBeTruthy();
  });

  test('reset-password rejects an unknown, expired or used token', async () => {
    claimedRows = [];

    const response = await post('/reset-password', { token: 'nope', password: 'new-password-1' });

    expect(response.status).toBe(400);
    expect(mockInvalidateUserSessions).not.toHaveBeenCalled();
  });

  test('reset-password rejects a weak password', async () => {
    const response = await post('/reset-password', { token: 'good', password: 'short' });

    expect(response.status).toBe(400);
  });

  test('reset-password sets the password, ends sessions and records it', async () => {
    claimedRows = [{ userId: 'user-1' }];

    const response = await post('/reset-password', { token: 'good', password: 'new-password-1' });

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(mockInvalidateUserSessions).toHaveBeenCalledWith('user-1');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', action: 'auth.password_reset' }),
    );
  });
});
