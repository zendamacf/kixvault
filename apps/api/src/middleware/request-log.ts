import { createMiddleware } from 'hono/factory';
import { isRequestLoggingEnabled, parseLogLevel } from '../lib/log-level';
import type { ApiEnv } from '../types';

const HEALTH_CHECK_PATH = '/api/health';

export const requestLogMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  const requestId = c.req.header('X-Request-Id') ?? crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-Id', requestId);

  const shouldLog =
    isRequestLoggingEnabled(parseLogLevel(process.env.LOG_LEVEL)) &&
    c.req.path !== HEALTH_CHECK_PATH;

  const start = shouldLog ? performance.now() : 0;

  await next();

  if (!shouldLog) {
    return;
  }

  const durationMs = Math.round(performance.now() - start);
  const user = c.get('user');
  const userSuffix = user ? ` user=${user.id}` : '';

  console.log(
    `${c.req.method} ${c.req.path} ${c.res.status} ${durationMs}ms requestId=${requestId}${userSuffix}`,
  );
});
