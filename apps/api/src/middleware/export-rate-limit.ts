import { createRateLimitMiddleware } from './rate-limit';

export const sneakerExportRateLimit = createRateLimitMiddleware({
  keyPrefix: 'sneakers:export',
  maxRequests: 5,
  windowMs: 60_000,
  resolveKey: (c) => c.get('user')?.id ?? null,
  requireKey: true,
});
