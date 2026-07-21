import { createMiddleware } from 'hono/factory';
import type { ApiEnv } from '../types';

type RateLimiterOptions = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitStore = Map<string, number[]>;

const stores = new Map<string, RateLimitStore>();

export function resetRateLimitersForTests(): void {
  for (const store of stores.values()) {
    store.clear();
  }
}

function getStore(keyPrefix: string): RateLimitStore {
  let store = stores.get(keyPrefix);

  if (!store) {
    store = new Map();
    stores.set(keyPrefix, store);
  }

  return store;
}

export function createRateLimiter({ keyPrefix, maxRequests, windowMs }: RateLimiterOptions) {
  const store = getStore(keyPrefix);

  return createMiddleware<ApiEnv>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const now = Date.now();
    const windowStart = now - windowMs;
    const key = user.id;
    const timestamps = (store.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

    if (timestamps.length >= maxRequests) {
      const oldestTimestamp = timestamps[0] ?? now;
      const retryAfterMs = oldestTimestamp + windowMs - now;
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ error: 'Too many requests' }, 429);
    }

    timestamps.push(now);
    store.set(key, timestamps);

    return next();
  });
}

export const catalogSearchRateLimit = createRateLimiter({
  keyPrefix: 'catalog:search',
  maxRequests: 30,
  windowMs: 60_000,
});

export const catalogFromCatalogRateLimit = createRateLimiter({
  keyPrefix: 'catalog:from-catalog',
  maxRequests: 20,
  windowMs: 60_000,
});
