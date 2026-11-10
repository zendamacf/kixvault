import { zValidator } from '@hono/zod-validator';
import { users } from '@kixvault/db';
import {
  EMAIL_NOT_VERIFIED_CODE,
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from '@kixvault/shared';
import { Hono } from 'hono';
import { generateIdFromEntropySize } from 'lucia';
import { recordAuditEvent } from '../lib/audit';
import { lucia } from '../lib/auth';
import { getRequestClientIp } from '../lib/client-ip';
import { db } from '../lib/db';
import { isEmailEnabled } from '../lib/email/config';
import {
  consumeVerificationToken,
  createVerificationToken,
  issueVerificationToken,
  sendVerificationEmail,
} from '../lib/email-verification';
import { env } from '../lib/env';
import { userEmailEquals } from '../lib/user-email';
import { authRateLimit } from '../middleware/auth-rate-limit';
import { sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const authRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .get('/config', (c) => c.json({ signupsEnabled: env.signupsEnabled }))
  .post('/register', authRateLimit, zValidator('json', registerSchema), async (c) => {
    if (!env.signupsEnabled) {
      return c.json({ error: 'Signups are disabled' }, 403);
    }

    const { email, password } = c.req.valid('json');

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(userEmailEquals(email));

    if (existingUser) {
      return c.json({ error: 'Email already in use' }, 409);
    }

    const userId = generateIdFromEntropySize(10);
    const passwordHash = await Bun.password.hash(password, { algorithm: 'argon2id' });

    // Without email configured nobody can be verified, so accounts are trusted as before.
    const requiresVerification = isEmailEnabled();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      emailVerifiedAt: requiresVerification ? null : new Date(),
    });

    await recordAuditEvent({
      userId,
      action: 'auth.register',
      ip: getRequestClientIp(c),
    });

    if (requiresVerification) {
      // No session until the address is confirmed. Sending never throws: the user can resend.
      const token = await issueVerificationToken(userId);
      await sendVerificationEmail(email, token);

      return c.json({ requiresVerification: true as const, user: { id: userId, email } }, 201);
    }

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return c.json({ requiresVerification: false as const, user: { id: userId, email } }, 201, {
      'Set-Cookie': sessionCookie.serialize(),
    });
  })
  .post('/login', authRateLimit, zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const [user] = await db.select().from(users).where(userEmailEquals(email));

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const validPassword = await Bun.password.verify(password, user.passwordHash);

    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    if (!user.emailVerifiedAt && isEmailEnabled()) {
      return c.json(
        { error: 'Confirm your email address to sign in', code: EMAIL_NOT_VERIFIED_CODE },
        403,
      );
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    await recordAuditEvent({
      userId: user.id,
      action: 'auth.login',
      ip: getRequestClientIp(c),
    });

    return c.json({ user: { id: user.id, email: user.email } }, 200, {
      'Set-Cookie': sessionCookie.serialize(),
    });
  })
  .post('/verify-email', authRateLimit, zValidator('json', verifyEmailSchema), async (c) => {
    const { token } = c.req.valid('json');
    const userId = await consumeVerificationToken(token);

    if (!userId) {
      return c.json({ error: 'This verification link is invalid or has expired' }, 400);
    }

    await recordAuditEvent({
      userId,
      action: 'auth.email_verified',
      ip: getRequestClientIp(c),
    });

    // Does not sign the user in: they sign in with their password.
    return c.json({ message: 'Email confirmed. You can now sign in.' }, 200);
  })
  .post(
    '/resend-verification',
    authRateLimit,
    zValidator('json', resendVerificationSchema),
    async (c) => {
      if (!isEmailEnabled()) {
        return c.json({ error: 'Email verification is not enabled' }, 503);
      }

      const { email } = c.req.valid('json');
      const token = await createVerificationToken(email);

      if (token) {
        // Not awaited, so response time does not show whether the account exists.
        void sendVerificationEmail(email, token);
      }

      // Same answer for unknown, verified and throttled accounts.
      return c.json(
        { message: 'If that account needs confirming, a new link is on its way.' },
        200,
      );
    },
  )
  .post('/logout', async (c) => {
    const session = c.get('session');
    const user = c.get('user');

    if (user) {
      await recordAuditEvent({
        userId: user.id,
        action: 'auth.logout',
        ip: getRequestClientIp(c),
      });
    }

    if (session) {
      await lucia.invalidateSession(session.id);
    }

    const sessionCookie = lucia.createBlankSessionCookie();

    return c.json({ success: true }, 200, { 'Set-Cookie': sessionCookie.serialize() });
  })
  .get('/me', async (c) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ user: null });
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  });
