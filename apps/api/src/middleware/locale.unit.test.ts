import { describe, expect, test } from 'bun:test';
import { Hono } from 'hono';
import { negotiateLocale } from '../lib/email/i18n';
import type { ApiEnv } from '../types';
import { localeMiddleware } from './locale';

describe('negotiateLocale', () => {
  test('defaults to English without a header', () => {
    expect(negotiateLocale(undefined)).toBe('en');
    expect(negotiateLocale('')).toBe('en');
  });

  test('matches on the primary language subtag', () => {
    expect(negotiateLocale('en-US')).toBe('en');
    expect(negotiateLocale('EN-gb,en;q=0.8')).toBe('en');
  });

  test('skips unsupported languages and honors q-values', () => {
    expect(negotiateLocale('fr-CA,fr;q=0.9,en;q=0.8')).toBe('en');
    expect(negotiateLocale('fr;q=0.9,en;q=0.5')).toBe('en');
    expect(negotiateLocale('*')).toBe('en');
  });

  test('ignores languages refused with q=0', () => {
    expect(negotiateLocale('en;q=0')).toBe('en');
  });
});

describe('localeMiddleware', () => {
  test('sets the locale on the request context', async () => {
    const app = new Hono<ApiEnv>()
      .use(localeMiddleware)
      .get('/', (c) => c.json({ locale: c.get('locale') }));

    const response = await app.request('/', { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });

    expect(await response.json()).toEqual({ locale: 'en' });
  });
});
