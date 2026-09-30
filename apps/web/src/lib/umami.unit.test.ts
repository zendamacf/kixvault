import { afterEach, describe, expect, test } from 'bun:test';
import { getUmamiDomain, getUmamiScriptUrl, getUmamiWebsiteId, isUmamiConfigured } from './umami';

function setUmamiConfig(umami: { websiteId?: string; domain?: string; scriptUrl?: string }) {
  window.__KIXVAULT_RUNTIME_CONFIG__ = { umami };
}

afterEach(() => {
  setUmamiConfig({});
});

describe('getUmamiWebsiteId', () => {
  test('returns trimmed website id when set', () => {
    setUmamiConfig({ websiteId: '  abc-123  ' });
    expect(getUmamiWebsiteId()).toBe('abc-123');
  });

  test('returns undefined when empty', () => {
    setUmamiConfig({ websiteId: '   ' });
    expect(getUmamiWebsiteId()).toBeUndefined();
  });
});

describe('getUmamiScriptUrl', () => {
  test('prefers explicit script URL', () => {
    setUmamiConfig({
      scriptUrl: 'https://cdn.example.com/umami.js',
      domain: 'https://analytics.example.com',
    });
    expect(getUmamiScriptUrl()).toBe('https://cdn.example.com/umami.js');
  });

  test('builds script URL from self-hosted domain', () => {
    setUmamiConfig({ domain: 'https://analytics.example.com/' });
    expect(getUmamiScriptUrl()).toBe('https://analytics.example.com/script.js');
    expect(getUmamiDomain()).toBe('https://analytics.example.com');
  });
});

describe('isUmamiConfigured', () => {
  test('is false without website id', () => {
    setUmamiConfig({ domain: 'https://analytics.example.com' });
    expect(isUmamiConfigured()).toBe(false);
  });

  test('is true with website id and domain', () => {
    setUmamiConfig({
      websiteId: 'site-id',
      domain: 'https://cloud.umami.is',
    });
    expect(isUmamiConfigured()).toBe(true);
  });
});
