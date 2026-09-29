import { getRequestClientIp } from '../lib/client-ip';
import { createRateLimitMiddleware } from './rate-limit';

/** Mitigates brute-force attempts against login and register. */
export const authRateLimit = createRateLimitMiddleware({
  keyPrefix: 'auth',
  maxRequests: 20,
  windowMs: 15 * 60_000,
  resolveKey: (c) => getRequestClientIp(c),
});
