import { getRequestClientIp } from '../lib/client-ip';
import { createRateLimitMiddleware } from './rate-limit';

export const globalApiRateLimit = createRateLimitMiddleware({
  keyPrefix: 'api:global',
  maxRequests: 300,
  windowMs: 60_000,
  resolveKey: (c) => getRequestClientIp(c),
});
