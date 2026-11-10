import { describe, expect, test } from 'bun:test';
import { formatMonth } from './analytics';

describe('formatMonth', () => {
  test('formats short and long labels', () => {
    expect(formatMonth('2026-11', 'short')).toContain('Nov');
    expect(formatMonth('2026-11', 'long')).toContain('2026');
  });

  test('adds the year to January short labels', () => {
    expect(formatMonth('2026-01', 'short')).toContain('2026');
  });

  test('handles missing or malformed values', () => {
    expect(formatMonth(undefined, 'short')).toBe('—');
    expect(formatMonth('nonsense', 'short')).toBe('nonsense');
  });
});
