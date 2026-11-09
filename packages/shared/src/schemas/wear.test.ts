import { describe, expect, test } from 'bun:test';
import { isWearDateAllowed, listWearsQuerySchema, logWearSchema, suggestCondition } from './wear';

describe('logWearSchema', () => {
  test('accepts an empty body', () => {
    expect(logWearSchema.safeParse({}).success).toBe(true);
  });

  test('accepts a valid date', () => {
    expect(logWearSchema.safeParse({ wornOn: '2026-11-09' }).success).toBe(true);
  });

  test('rejects a bad format', () => {
    expect(logWearSchema.safeParse({ wornOn: '09/11/2026' }).success).toBe(false);
  });

  test('rejects an impossible date', () => {
    expect(logWearSchema.safeParse({ wornOn: '2026-13-45' }).success).toBe(false);
  });
});

describe('listWearsQuerySchema', () => {
  test('accepts a valid range', () => {
    expect(listWearsQuerySchema.safeParse({ from: '2026-10-26', to: '2026-12-06' }).success).toBe(
      true,
    );
  });

  test('rejects an inverted range', () => {
    expect(listWearsQuerySchema.safeParse({ from: '2026-12-06', to: '2026-10-26' }).success).toBe(
      false,
    );
  });

  test('rejects a range over the limit', () => {
    expect(listWearsQuerySchema.safeParse({ from: '2026-01-01', to: '2026-12-31' }).success).toBe(
      false,
    );
  });
});

describe('suggestCondition', () => {
  test('suggests lightly worn after the first wear of a deadstock pair', () => {
    expect(suggestCondition('deadstock', 0)).toBeNull();
    expect(suggestCondition('deadstock', 1)).toBe('lightly_worn');
  });

  test('suggests worn after 15 wears', () => {
    expect(suggestCondition('lightly_worn', 14)).toBeNull();
    expect(suggestCondition('lightly_worn', 15)).toBe('worn');
  });

  test('suggests beat after 40 wears', () => {
    expect(suggestCondition('worn', 39)).toBeNull();
    expect(suggestCondition('worn', 40)).toBe('beat');
  });

  test('never suggests a change from beat', () => {
    expect(suggestCondition('beat', 500)).toBeNull();
  });

  test('suggests only the next condition', () => {
    expect(suggestCondition('lightly_worn', 100)).toBe('worn');
  });
});

describe('isWearDateAllowed', () => {
  const now = new Date('2026-11-09T12:00:00Z');

  test('allows today and tomorrow', () => {
    expect(isWearDateAllowed('2026-11-09', now)).toBe(true);
    expect(isWearDateAllowed('2026-11-10', now)).toBe(true);
  });

  test('rejects later dates', () => {
    expect(isWearDateAllowed('2026-11-11', now)).toBe(false);
  });

  test('allows past dates', () => {
    expect(isWearDateAllowed('2025-01-01', now)).toBe(true);
  });
});
