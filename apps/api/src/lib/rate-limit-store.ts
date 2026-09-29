import Redis from 'ioredis';
import { env } from './env';

export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export interface RateLimitStore {
  consume(key: string, maxRequests: number, windowMs: number): Promise<RateLimitDecision>;
  reset(): Promise<void>;
}

const REDIS_KEY_PREFIX = 'ratelimit:';

function computeRetryAfterSeconds(
  timestamps: number[],
  windowMs: number,
  now: number,
): number {
  const oldestTimestamp = timestamps[0] ?? now;
  const retryAfterMs = oldestTimestamp + windowMs - now;
  return Math.max(1, Math.ceil(retryAfterMs / 1000));
}

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly entries = new Map<string, number[]>();

  async consume(key: string, maxRequests: number, windowMs: number): Promise<RateLimitDecision> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (this.entries.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (timestamps.length >= maxRequests) {
      return {
        allowed: false,
        retryAfterSeconds: computeRetryAfterSeconds(timestamps, windowMs, now),
      };
    }

    timestamps.push(now);
    this.entries.set(key, timestamps);

    return { allowed: true };
  }

  async reset(): Promise<void> {
    this.entries.clear();
  }
}

export class RedisRateLimitStore implements RateLimitStore {
  private readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  private toRedisKey(key: string): string {
    return `${REDIS_KEY_PREFIX}${key}`;
  }

  async consume(key: string, maxRequests: number, windowMs: number): Promise<RateLimitDecision> {
    const now = Date.now();
    const windowStart = now - windowMs;
    const redisKey = this.toRedisKey(key);
    const member = `${now}:${Math.random().toString(36).slice(2)}`;

    await this.client.zremrangebyscore(redisKey, 0, windowStart);
    const count = await this.client.zcard(redisKey);

    if (count >= maxRequests) {
      const oldest = await this.client.zrange(redisKey, 0, 0, 'WITHSCORES');
      const oldestTimestamp = Number(oldest[1] ?? now);

      return {
        allowed: false,
        retryAfterSeconds: computeRetryAfterSeconds([oldestTimestamp], windowMs, now),
      };
    }

    await this.client.zadd(redisKey, now, member);
    await this.client.pexpire(redisKey, windowMs);

    return { allowed: true };
  }

  async reset(): Promise<void> {
    const keys = await this.client.keys(`${REDIS_KEY_PREFIX}*`);

    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

let store: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (!store) {
    store = env.redisUrl ? new RedisRateLimitStore(env.redisUrl) : new InMemoryRateLimitStore();
  }

  return store;
}

export function resetRateLimitStoreForTests(): void {
  store = new InMemoryRateLimitStore();
}
