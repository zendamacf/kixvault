import { describe, expect, test } from 'bun:test';
import { getActiveLocale, i18n } from './index';

describe('i18n', () => {
  test('defaults to English', () => {
    expect(getActiveLocale()).toBe('en');
  });

  test('resolves login copy from message keys', () => {
    expect(i18n.t('login.title')).toBe('Welcome back');
    expect(i18n.t('login.submit')).toBe('Sign in');
    expect(i18n.t('login.signupLink')).toBe('Create an account');
  });
});
