import { afterEach, describe, expect, test } from 'bun:test';
import {
  getUmamiDomain,
  getUmamiScriptUrl,
  getUmamiWebsiteId,
  isUmamiConfigured,
  shouldRespectDoNotTrack,
} from './umami';

const env = import.meta.env as Record<string, string | undefined>;

function setEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
}

afterEach(() => {
  setEnv({
    VITE_UMAMI_WEBSITE_ID: undefined,
    VITE_UMAMI_SCRIPT_URL: undefined,
    VITE_UMAMI_DOMAIN: undefined,
  });
});

describe('getUmamiWebsiteId', () => {
  test('returns trimmed website id when set', () => {
    setEnv({ VITE_UMAMI_WEBSITE_ID: '  abc-123  ' });
    expect(getUmamiWebsiteId()).toBe('abc-123');
  });

  test('returns undefined when empty', () => {
    setEnv({ VITE_UMAMI_WEBSITE_ID: '   ' });
    expect(getUmamiWebsiteId()).toBeUndefined();
  });
});

describe('getUmamiScriptUrl', () => {
  test('prefers explicit script URL', () => {
    setEnv({
      VITE_UMAMI_SCRIPT_URL: 'https://cdn.example.com/umami.js',
      VITE_UMAMI_DOMAIN: 'https://analytics.example.com',
    });
    expect(getUmamiScriptUrl()).toBe('https://cdn.example.com/umami.js');
  });

  test('builds script URL from self-hosted domain', () => {
    setEnv({ VITE_UMAMI_DOMAIN: 'https://analytics.example.com/' });
    expect(getUmamiScriptUrl()).toBe('https://analytics.example.com/script.js');
    expect(getUmamiDomain()).toBe('https://analytics.example.com');
  });
});

describe('isUmamiConfigured', () => {
  test('is false without website id', () => {
    setEnv({ VITE_UMAMI_DOMAIN: 'https://analytics.example.com' });
    expect(isUmamiConfigured()).toBe(false);
  });

  test('is true with website id and domain', () => {
    setEnv({
      VITE_UMAMI_WEBSITE_ID: 'site-id',
      VITE_UMAMI_DOMAIN: 'https://cloud.umami.is',
    });
    expect(isUmamiConfigured()).toBe(true);
  });
});

describe('shouldRespectDoNotTrack', () => {
  test('returns true when Do Not Track is enabled', () => {
    Object.defineProperty(globalThis.navigator, 'doNotTrack', {
      configurable: true,
      value: '1',
    });
    expect(shouldRespectDoNotTrack()).toBe(true);
  });

  test('returns false when Do Not Track is unset', () => {
    Object.defineProperty(globalThis.navigator, 'doNotTrack', {
      configurable: true,
      value: 'unspecified',
    });
    Object.defineProperty(globalThis.navigator, 'globalPrivacyControl', {
      configurable: true,
      value: false,
    });
    expect(shouldRespectDoNotTrack()).toBe(false);
  });
});
