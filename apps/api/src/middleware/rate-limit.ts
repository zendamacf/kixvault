import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';
import { getRateLimitStore } from '../lib/rate-limit-store';
import type { ApiEnv } from '../types';

export type RateLimitOptions = {
  keyPrefix: string;
  maxRequests: number;
  windowMs: number;
  resolveKey: (c: Context<ApiEnv>) => string | null;
  requireKey?: boolean;
};

export function createRateLimitMiddleware({
  keyPrefix,
  maxRequests,
  windowMs,
  resolveKey,
  requireKey = false,
}: RateLimitOptions) {
  return createMiddleware<ApiEnv>(async (c, next) => {
    const key = resolveKey(c);

    if (!key) {
      if (requireKey) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      return next();
    }

    const store = getRateLimitStore();
    const decision = await store.consume(`${keyPrefix}:${key}`, maxRequests, windowMs);

    if (!decision.allowed) {
      const retryAfterSeconds = decision.retryAfterSeconds ?? 1;
      c.header('Retry-After', String(retryAfterSeconds));
      return c.json({ error: 'Too many requests' }, 429);
    }

    return next();
  });
}
