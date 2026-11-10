import { afterEach, describe, expect, it } from 'bun:test';
import { redactDeep, redactSecrets } from './redact';

const saved = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
  Object.assign(process.env, saved);
});

describe('redaction', () => {
  it.each(['RESEND_API_KEY', 'KICKSDB_API_KEY', 'SENTRY_AUTH_TOKEN'])('redacts %s', (name) => {
    process.env[name] = 'super-secret-value-123';
    expect(redactSecrets('oops super-secret-value-123 here')).toBe('oops [REDACTED] here');
  });

  it('redacts DATABASE_URL and its password on their own', () => {
    process.env.DATABASE_URL = 'postgresql://kix:hunter2hunter2@db:5432/kix';
    const out = redactSecrets(
      'connect postgresql://kix:hunter2hunter2@db:5432/kix; pw hunter2hunter2',
    );
    expect(out).not.toContain('hunter2');
  });

  it('redacts connection-string credentials even when not in env', () => {
    expect(redactSecrets('postgres://u:pw@host/db')).toBe('postgres://u:[REDACTED]@host/db');
    expect(redactSecrets('redis://:pw@host:6379')).toBe('redis://:[REDACTED]@host:6379');
  });

  it('redacts resend-style keys', () => {
    expect(redactSecrets('re_abcdefghij12345')).toBe('[REDACTED]');
  });

  it('leaves short values alone', () => {
    process.env.RESEND_API_KEY = 'abc';
    expect(redactSecrets('abc')).toBe('abc');
  });

  it('deep-redacts nested objects', () => {
    process.env.KICKSDB_API_KEY = 'super-secret-value-123';
    expect(redactDeep({ a: { b: ['x super-secret-value-123'] } })).toEqual({
      a: { b: ['x [REDACTED]'] },
    });
  });
});
