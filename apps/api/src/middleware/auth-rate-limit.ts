import { getRequestClientIp } from '../lib/client-ip';
import { createRateLimitMiddleware } from './rate-limit';

/** Mitigates brute-force attempts against login and register (10 per 15 minutes per IP). */
export const authRateLimit = createRateLimitMiddleware({
  keyPrefix: 'auth',
  maxRequests: 10,
  windowMs: 15 * 60_000,
  resolveKey: (c) => getRequestClientIp(c),
});

/**
 * Password recovery sends email and is a cheap way to spam an inbox, so it is limited far harder
 * than login: 5 requests per hour per client IP. A per-address limit applies on top (see the
 * forgot-password route).
 */
export const FORGOT_PASSWORD_MAX_PER_IP = 5;
export const FORGOT_PASSWORD_MAX_PER_EMAIL = 3;
export const FORGOT_PASSWORD_WINDOW_MS = 60 * 60_000;

export const forgotPasswordRateLimit = createRateLimitMiddleware({
  keyPrefix: 'auth:forgot-password',
  maxRequests: FORGOT_PASSWORD_MAX_PER_IP,
  windowMs: FORGOT_PASSWORD_WINDOW_MS,
  resolveKey: (c) => getRequestClientIp(c),
});

/** Completing a reset needs a valid emailed token, but still cap guessing per client IP. */
export const resetPasswordRateLimit = createRateLimitMiddleware({
  keyPrefix: 'auth:reset-password',
  maxRequests: 10,
  windowMs: 15 * 60_000,
  resolveKey: (c) => getRequestClientIp(c),
});

/** Resending verification sends email too, so it gets the same hourly limits as password recovery. */
export const resendVerificationRateLimit = createRateLimitMiddleware({
  keyPrefix: 'auth:resend-verification',
  maxRequests: FORGOT_PASSWORD_MAX_PER_IP,
  windowMs: FORGOT_PASSWORD_WINDOW_MS,
  resolveKey: (c) => getRequestClientIp(c),
});
