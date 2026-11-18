import { describe, expect, test } from 'bun:test';
import { SUPPORTED_CURRENCIES } from '../currencies';
import { updateSettingsSchema } from './settings';

describe('updateSettingsSchema', () => {
  test('accepts every supported currency', () => {
    for (const currency of SUPPORTED_CURRENCIES) {
      expect(updateSettingsSchema.safeParse({ currency }).success).toBe(true);
    }
  });

  test('rejects unsupported or lowercase codes', () => {
    expect(updateSettingsSchema.safeParse({ currency: 'XXX' }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({ currency: 'eur' }).success).toBe(false);
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });

  test('lists USD first and has no duplicates', () => {
    expect(SUPPORTED_CURRENCIES[0]).toBe('USD');
    expect(new Set(SUPPORTED_CURRENCIES).size).toBe(SUPPORTED_CURRENCIES.length);
  });
});
