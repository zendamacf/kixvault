import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { lucia } from '../lib/auth.js';
import type { ApiEnv } from '../types.js';

export const sessionMiddleware = createMiddleware<ApiEnv>(async (c, next) => {
  const sessionId = getCookie(c, lucia.sessionCookieName) ?? null;

  if (!sessionId) {
    c.set('user', null);
    c.set('session', null);
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
  return next();
});

export const requireAuth = createMiddleware<ApiEnv>(async (c, next) => {
  if (!c.get('user')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  return next();
});
