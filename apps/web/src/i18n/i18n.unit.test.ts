import { describe, expect, test } from 'bun:test';
import { Glob } from 'bun';
import { getActiveLocale, i18n } from './index';
import en from './locales/en.json';

describe('i18n', () => {
  test('defaults to English', () => {
    expect(getActiveLocale()).toBe('en');
  });

  test('resolves login copy from message keys', () => {
    expect(i18n.t('login.title')).toBe('Welcome back');
    expect(i18n.t('login.submit')).toBe('Sign in');
    expect(i18n.t('login.signupLink')).toBe('Create an account');
  });

  test('resolves every static translation key used in the source', async () => {
    const root = new URL('..', import.meta.url).pathname;
    const missing: string[] = [];
    const callPattern = /\bt\(\s*'([A-Za-z0-9_.:-]+)'|i18nKey="([A-Za-z0-9_.:-]+)"/g;

    for await (const file of new Glob('**/*.{ts,tsx}').scan(root)) {
      if (file.includes('.test.') || file.endsWith('routeTree.gen.ts')) {
        continue;
      }

      const source = await Bun.file(`${root}${file}`).text();

      for (const match of source.matchAll(callPattern)) {
        const key = match[1] ?? match[2];

        // Plural keys are stored as key_one / key_other.
        if (!i18n.exists(key) && !i18n.exists(key, { count: 2 })) {
          missing.push(`${file}: ${key}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });

  test('uses US English spelling', () => {
    const british = /colour|favour|behaviour|centre|catalogue|organis|cancell|licence|\bgrey/gi;

    expect(JSON.stringify(en).match(british) ?? []).toEqual([]);
  });
});
