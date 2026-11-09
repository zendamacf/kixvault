import { describe, expect, test } from 'bun:test';
import { loginSchema, registerSchema, resendVerificationSchema, verifyEmailSchema } from './auth';

describe('registerSchema', () => {
  test('accepts valid registration input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.success).toBe(true);
  });

  test('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result.success).toBe(false);
  });

  test('rejects passwords shorter than 8 characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  test('accepts valid login input', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'x',
    });

    expect(result.success).toBe(true);
  });

  test('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('email normalisation', () => {
  test('trims and lowercases addresses', () => {
    const result = registerSchema.safeParse({
      email: '  User@Example.COM ',
      password: 'password123',
    });

    expect(result.success && result.data.email).toBe('user@example.com');
  });

  test.each(['user', 'user@', '@example.com', 'user@localhost', 'us er@example.com'])(
    'rejects malformed address %s with a clear message',
    (email) => {
      const result = registerSchema.safeParse({ email, password: 'password123' });

      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe('Enter a valid email address');
    },
  );

  test('rejects addresses over 254 characters', () => {
    const email = `${'a'.repeat(250)}@example.com`;

    expect(registerSchema.safeParse({ email, password: 'password123' }).success).toBe(false);
  });
});

describe('verifyEmailSchema', () => {
  test('requires a token', () => {
    expect(verifyEmailSchema.safeParse({ token: 'abc' }).success).toBe(true);
    expect(verifyEmailSchema.safeParse({ token: '' }).success).toBe(false);
  });
});

describe('resendVerificationSchema', () => {
  test('normalises the email', () => {
    const result = resendVerificationSchema.safeParse({ email: ' A@B.co ' });

    expect(result.success && result.data.email).toBe('a@b.co');
  });
});
