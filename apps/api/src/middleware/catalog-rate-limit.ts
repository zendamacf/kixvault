import { createRateLimitMiddleware } from './rate-limit';

export { resetRateLimitStoreForTests as resetRateLimitersForTests } from '../lib/rate-limit-store';

export const catalogSearchRateLimit = createRateLimitMiddleware({
  keyPrefix: 'catalog:search',
  maxRequests: 30,
  windowMs: 60_000,
  resolveKey: (c) => c.get('user')?.id ?? null,
  requireKey: true,
});

export const catalogFromCatalogRateLimit = createRateLimitMiddleware({
  keyPrefix: 'catalog:from-catalog',
  maxRequests: 20,
  windowMs: 60_000,
  resolveKey: (c) => c.get('user')?.id ?? null,
  requireKey: true,
});
