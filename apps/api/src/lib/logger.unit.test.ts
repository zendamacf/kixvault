import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import { logger } from './logger';

const original = process.env.RESEND_API_KEY;

describe('logger', () => {
  let errorSpy: ReturnType<typeof spyOn>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'super-secret-value-123';
    errorSpy = spyOn(console, 'error').mockImplementation(() => undefined);
    logSpy = spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    errorSpy.mockRestore();
    logSpy.mockRestore();
    if (original === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = original;
  });

  test('redacts secrets in string arguments', () => {
    logger.log('key is super-secret-value-123');
    expect(logSpy).toHaveBeenCalledWith('key is [REDACTED]');
  });

  test('redacts secrets in errors and nested objects', () => {
    logger.error('failed', { error: new Error('401 super-secret-value-123') });
    const line = String(errorSpy.mock.calls[0]?.[0]);
    expect(line).toContain('failed');
    expect(line).toContain('401 [REDACTED]');
    expect(line).not.toContain('super-secret');
  });
});
