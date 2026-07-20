import { describe, expect, test } from 'bun:test';
import { isRequestLoggingEnabled, parseLogLevel } from './log-level';

describe('parseLogLevel', () => {
  test('defaults to info when unset', () => {
    expect(parseLogLevel(undefined)).toBe('info');
  });

  test('accepts known log levels', () => {
    expect(parseLogLevel('debug')).toBe('debug');
    expect(parseLogLevel('SILENT')).toBe('silent');
  });

  test('falls back to info for unknown values', () => {
    expect(parseLogLevel('verbose')).toBe('info');
  });
});

describe('isRequestLoggingEnabled', () => {
  test('disables request logging for silent', () => {
    expect(isRequestLoggingEnabled('silent')).toBe(false);
  });

  test('enables request logging for other levels', () => {
    expect(isRequestLoggingEnabled('error')).toBe(true);
    expect(isRequestLoggingEnabled('info')).toBe(true);
    expect(isRequestLoggingEnabled('debug')).toBe(true);
  });
});
