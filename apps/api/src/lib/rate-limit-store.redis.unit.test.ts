import { beforeEach, describe, expect, mock, test } from 'bun:test';

const mockZremrangebyscore = mock(async () => 0);
const mockZcard = mock(async () => 0);
const mockZrange = mock(async () => ['member', String(Date.now())]);
const mockZadd = mock(async () => 1);
const mockPexpire = mock(async () => 1);
const mockKeys = mock(async () => [] as string[]);
const mockDel = mock(async () => 1);

mock.module('ioredis', () => ({
  default: class MockRedis {
    zremrangebyscore = mockZremrangebyscore;
    zcard = mockZcard;
    zrange = mockZrange;
    zadd = mockZadd;
    pexpire = mockPexpire;
    keys = mockKeys;
    del = mockDel;
  },
}));

mock.module('./env', () => ({
  env: {
    redisUrl: 'redis://localhost:6379',
  },
}));

describe('RedisRateLimitStore', () => {
  beforeEach(() => {
    mockZcard.mockImplementation(async () => 0);
  });

  test('allows a request and records it in Redis', async () => {
    const { RedisRateLimitStore } = await import('./rate-limit-store');
    const store = new RedisRateLimitStore('redis://localhost:6379');
    const decision = await store.consume('client-ip', 5, 60_000);

    expect(decision.allowed).toBe(true);
    expect(mockZadd).toHaveBeenCalled();
    expect(mockPexpire).toHaveBeenCalled();
  });

  test('returns retry-after when the Redis window is full', async () => {
    mockZcard.mockImplementationOnce(async () => 5);

    const { RedisRateLimitStore } = await import('./rate-limit-store');
    const store = new RedisRateLimitStore('redis://localhost:6379');

    const decision = await store.consume('blocked-ip', 5, 60_000);

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });
});
