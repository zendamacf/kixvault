import { createMiddleware } from 'hono/factory';
import { negotiateLocale } from '../lib/email/i18n';
import type { ApiEnv } from '../types';

/** Resolves the request's language from `Accept-Language` and exposes it as `c.get('locale')`. */
export const localeMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  c.set('locale', negotiateLocale(c.req.header('Accept-Language')));
  await next();
});
