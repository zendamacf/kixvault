import { beforeEach, describe, expect, test } from 'bun:test';
import { InMemoryRateLimitStore } from './rate-limit-store';

describe('InMemoryRateLimitStore', () => {
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
  });

  test('allows requests under the limit', async () => {
    const decision = await store.consume('test-key', 3, 60_000);

    expect(decision.allowed).toBe(true);
  });

  test('blocks requests over the limit and returns retry-after seconds', async () => {
    for (let index = 0; index < 3; index += 1) {
      const allowed = await store.consume('blocked-key', 3, 60_000);
      expect(allowed.allowed).toBe(true);
    }

    const blocked = await store.consume('blocked-key', 3, 60_000);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});
