import { createMiddleware } from 'hono/factory';
import { isRequestLoggingEnabled, parseLogLevel } from '../lib/log-level';
import { logger } from '../lib/logger';
import type { ApiEnv } from '../types';

const HEALTH_CHECK_PATHS = new Set(['/health', '/api/health']);

export const requestLogMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  const requestId = c.req.header('X-Request-Id') ?? crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);

  const shouldLog =
    isRequestLoggingEnabled(parseLogLevel(process.env.LOG_LEVEL)) &&
    !HEALTH_CHECK_PATHS.has(c.req.path);

  const start = shouldLog ? performance.now() : 0;

  await next();

  if (!shouldLog) {
    return;
  }

  const durationMs = Math.round(performance.now() - start);
  const user = c.get('user');
  const userSuffix = user ? ` user=${user.id}` : '';

  logger.log(
    `${c.req.method} ${c.req.path} ${c.res.status} ${durationMs}ms requestId=${requestId}${userSuffix}`,
  );
});
