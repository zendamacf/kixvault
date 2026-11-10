import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

const mockEnv = {
  databaseUrl: 'postgresql://example.com/db',
  resendApiKey: undefined as string | undefined,
  emailFrom: 'KixVault <noreply@kixvault.example>',
  appUrl: 'https://kixvault.example',
  isProduction: false,
};

mock.module('../env', () => ({ env: mockEnv }));

const { getEmailProvider, isEmailEnabled } = await import('./config');
const { sendEmail } = await import('./send');

const props = { verifyUrl: 'https://kixvault.example/verify-email?token=t', expiresInHours: 24 };

describe('email config', () => {
  afterEach(() => {
    mockEnv.resendApiKey = undefined;
  });

  test('falls back to the console provider without an API key', () => {
    expect(isEmailEnabled()).toBe(false);
    expect(getEmailProvider().name).toBe('console');
  });

  test('uses Resend when an API key is set', () => {
    mockEnv.resendApiKey = 're_test';

    expect(isEmailEnabled()).toBe(true);
    expect(getEmailProvider().name).toBe('resend');
  });
});

// The logger redacts configured secrets. CI's database password ("kixvault") also appears in the
// fixture URLs below, so clear secret env vars to keep these assertions about the email itself.
const SECRET_ENV_VARS = [
  'DATABASE_URL',
  'TEST_DATABASE_URL',
  'REDIS_URL',
  'KICKSDB_API_KEY',
  'RESEND_API_KEY',
  'SENTRY_AUTH_TOKEN',
];
const savedSecrets = Object.fromEntries(SECRET_ENV_VARS.map((name) => [name, process.env[name]]));

describe('sendEmail', () => {
  let infoSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;
  let fetchSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    for (const name of SECRET_ENV_VARS) delete process.env[name];
    mockEnv.resendApiKey = undefined;
    mockEnv.isProduction = false;
    infoSpy = spyOn(console, 'info').mockImplementation(() => undefined);
    errorSpy = spyOn(console, 'error').mockImplementation(() => undefined);
    fetchSpy = spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(savedSecrets)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    infoSpy.mockRestore();
    errorSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  test('logs to the console when Resend is not configured', async () => {
    const sent = await sendEmail('verifyEmail', 'user@example.com', props);

    expect(sent).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    const line = String(infoSpy.mock.calls[0]?.[0]);
    expect(line).toContain('user@example.com');
    expect(line).toContain(props.verifyUrl);
  });

  test('does not log the email body in production', async () => {
    mockEnv.isProduction = true;

    await sendEmail('verifyEmail', 'user@example.com', props);

    const line = String(infoSpy.mock.calls[0]?.[0]);
    expect(line).not.toContain('text:');
    expect(line).not.toContain(props.verifyUrl);
  });

  test('posts to Resend when an API key is set', async () => {
    mockEnv.resendApiKey = 're_test';
    fetchSpy.mockResolvedValue(new Response('{}', { status: 200 }));

    const sent = await sendEmail('verifyEmail', 'user@example.com', props);

    expect(sent).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test');
    const body = JSON.parse(init.body as string);
    expect(body.from).toBe(mockEnv.emailFrom);
    expect(body.to).toEqual(['user@example.com']);
    expect(body.subject).toContain('KixVault');
    expect(body.html).toContain('<!doctype html>');
    expect(body.text).toContain(props.verifyUrl);
  });

  test('returns false instead of throwing when Resend rejects the message', async () => {
    mockEnv.resendApiKey = 're_test';
    fetchSpy.mockResolvedValue(new Response('bad request', { status: 422 }));

    await expect(sendEmail('verifyEmail', 'user@example.com', props)).resolves.toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('returns false instead of throwing on network errors', async () => {
    mockEnv.resendApiKey = 're_test';
    fetchSpy.mockRejectedValue(new Error('network down'));

    await expect(sendEmail('verifyEmail', 'user@example.com', props)).resolves.toBe(false);
  });
});
