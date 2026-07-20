import * as Sentry from '@sentry/bun';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { lucia } from '../lib/auth';
import { env } from '../lib/env';
import type { ApiEnv } from '../types';

export const sessionMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;

  if (!sessionId) {
    c.set('user', null);
    c.set('session', null);
    if (env.isProduction) {
      Sentry.setUser(null);
    }
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session?.fresh) {
    c.header('Set-Cookie', lucia.createSessionCookie(session.id).serialize(), {
      append: true,
    });
  }

  if (!session) {
    c.header('Set-Cookie', lucia.createBlankSessionCookie().serialize(), {
      append: true,
    });
  }

  c.set('session', session);
  c.set('user', user);
  if (env.isProduction) {
    Sentry.setUser(user ? { id: user.id } : null);
  }
  return next();
});

export const requireAuth = createMiddleware<ApiEnv>(async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});
