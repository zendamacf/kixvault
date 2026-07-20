import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockInsert = mock(async () => undefined);
const mockSelect = mock(() => ({
  from: () => ({
    where: async () => [] as { id: string; emailVerified?: boolean; passwordHash?: string }[],
  }),
}));
const mockCreateSession = mock(async () => ({ id: 'session-1' }));
const mockCreateSessionCookie = mock(() => ({
  serialize: () => 'auth_session=session-1; Path=/',
}));
const mockCreateVerificationToken = mock(async () => 'raw-token');
const mockSendVerificationEmail = mock(async () => undefined);
const mockVerifyEmailToken = mock(async () => ({ success: true as const }));
const mockResendVerificationEmail = mock(async () => ({ sent: true, rateLimited: false }));

const mockEnv = {
  signupsEnabled: false,
  databaseUrl: 'postgresql://example.com/db',
  kicksdbApiKey: undefined,
  port: 3000,
  isProduction: false,
  logLevel: 'info' as const,
  sentryDsn: '',
  sentryRelease: undefined,
  resendApiKey: undefined,
  emailFrom: 'KixVault <onboarding@resend.dev>',
  appUrl: 'http://localhost:5173',
};

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

mock.module('../lib/verification', () => ({
  createVerificationToken: mockCreateVerificationToken,
  verifyEmailToken: mockVerifyEmailToken,
  resendVerificationEmail: mockResendVerificationEmail,
}));

mock.module('../lib/email', () => ({
  sendVerificationEmail: mockSendVerificationEmail,
}));

mock.module('../middleware/session', () => ({
  sessionMiddleware: async (_c: unknown, next: () => Promise<void>) => {
    await next();
  },
}));

mock.module('../lib/env', () => ({
  env: mockEnv,
}));

const { authRoutes } = await import('./auth');

describe('authRoutes register', () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockCreateSession.mockClear();
    mockCreateSessionCookie.mockClear();
    mockCreateVerificationToken.mockClear();
    mockSendVerificationEmail.mockClear();
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

  test('creates a user and sends verification email when signups are enabled', async () => {
    mockEnv.signupsEnabled = true;

    const response = await authRoutes.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });

    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalled();
    expect(mockCreateVerificationToken).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      message: 'Check your email to verify your account',
    });
  });
});

describe('authRoutes login', () => {
  beforeEach(() => {
    mockSelect.mockImplementation(() => ({
      from: () => ({
        where: async () => [],
      }),
    }));
    mockCreateSession.mockClear();
    mockCreateSessionCookie.mockClear();
  });

  test('returns 403 when email is not verified', async () => {
    mockSelect.mockImplementation(() => ({
      from: () => ({
        where: async () => [
          {
            id: 'user-1',
            email: 'user@example.com',
            passwordHash: await Bun.password.hash('password123', { algorithm: 'argon2id' }),
            emailVerified: false,
          },
        ],
      }),
    }));

    const response = await authRoutes.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
    });

    expect(response.status).toBe(403);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});

describe('authRoutes verify-email', () => {
  test('verifies a valid token', async () => {
    const response = await authRoutes.request('/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'raw-token' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: 'Email verified successfully' });
  });
});

describe('authRoutes resend-verification', () => {
  test('returns generic success message', async () => {
    const response = await authRoutes.request('/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: 'If an account exists and is unverified, a verification email has been sent',
    });
  });
});
