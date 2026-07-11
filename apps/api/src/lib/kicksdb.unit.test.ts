import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { mockConfigureClient, mockKicksdbSdk, resetKicksdbSdkMocks } from '../test/mocks/kicksdb';

mockKicksdbSdk();

mock.module('./env', () => ({
  env: {
    kicksdbApiKey: 'KICKS-test-key',
    databaseUrl: 'postgresql://example.com/db',
    port: 3000,
    isProduction: false,
  },
}));

describe('kicksdb client setup', () => {
  beforeEach(async () => {
    resetKicksdbSdkMocks();
    const kicksdb = await import('./kicksdb');
    kicksdb.resetKicksdbClientForTests();
  });

  afterEach(async () => {
    const kicksdb = await import('./kicksdb');
    kicksdb.resetKicksdbClientForTests();
  });

  test('isKicksdbConfigured reflects whether an API key is present', async () => {
    const { isKicksdbConfigured } = await import('./kicksdb');
    expect(isKicksdbConfigured()).toBe(true);
  });

  test('ensureKicksdbClient configures the SDK once', async () => {
    const { ensureKicksdbClient } = await import('./kicksdb');

    ensureKicksdbClient();
    ensureKicksdbClient();

    expect(mockConfigureClient).toHaveBeenCalledTimes(1);
    expect(mockConfigureClient).toHaveBeenCalledWith('KICKS-test-key');
  });
});
