import { describe, expect, mock, test } from 'bun:test';

mock.module('./db', () => ({ db: {} }));

mock.module('./env', () => ({
  env: {
    databaseUrl: 'postgresql://example.com/db',
    resendApiKey: undefined,
    emailFrom: 'KixVault <test@example.com>',
    appUrl: 'https://kixvault.example',
    isProduction: false,
  },
}));

const { buildVerifyUrl, generateToken, hashToken } = await import('./email-verification');

describe('email verification tokens', () => {
  test('hashToken is a stable SHA-256 hex digest that differs from the token', () => {
    const token = generateToken();

    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).not.toBe(token);
  });

  test('generateToken makes unique url-safe tokens', () => {
    const a = generateToken();
    const b = generateToken();

    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  test('buildVerifyUrl points at the web app and encodes the token', () => {
    expect(buildVerifyUrl('a+b/c')).toBe('https://kixvault.example/verify-email?token=a%2Bb%2Fc');
  });
});
