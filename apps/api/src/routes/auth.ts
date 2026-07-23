import { zValidator } from '@hono/zod-validator';
import { users } from '@kixvault/db';
import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from '@kixvault/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { generateIdFromEntropySize } from 'lucia';
import { lucia } from '../lib/auth';
import { db } from '../lib/db';
import { sendVerificationEmail } from '../lib/email';
import { env } from '../lib/env';
import {
  createVerificationToken,
  resendVerificationEmail,
  verifyEmailToken,
} from '../lib/verification';
import { sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const authRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .get('/config', (c) => c.json({ signupsEnabled: env.signupsEnabled }))
  .post('/register', zValidator('json', registerSchema), async (c) => {
    if (!env.signupsEnabled) {
      return c.json({ error: 'Signups are disabled' }, 403);
    }

    const { email, password } = c.req.valid('json');

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));

    if (existingUser) {
      return c.json({ error: 'Email already in use' }, 409);
    }

    const userId = generateIdFromEntropySize(10);
    const passwordHash = await Bun.password.hash(password, { algorithm: 'argon2id' });

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      emailVerified: false,
    });

    const rawToken = await createVerificationToken(userId);
    await sendVerificationEmail({ to: email, token: rawToken });

    return c.json({ message: 'Check your email to verify your account' }, 201);
  })
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const validPassword = await Bun.password.verify(password, user.passwordHash);

    if (!validPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    if (!user.emailVerified) {
      return c.json(
        { error: 'Email not verified. Check your inbox or request a new verification link.' },
        403,
      );
    }

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    return c.json({ user: { id: user.id, email: user.email } }, 200, {
      'Set-Cookie': sessionCookie.serialize(),
    });
  })
  .post('/verify-email', zValidator('json', verifyEmailSchema), async (c) => {
    const { token } = c.req.valid('json');
    const result = await verifyEmailToken(token);

    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }

    return c.json({ message: 'Email verified successfully' });
  })
  .post('/resend-verification', zValidator('json', resendVerificationSchema), async (c) => {
    const { email } = c.req.valid('json');
    const result = await resendVerificationEmail(email);

    if (result.rateLimited) {
      return c.json({ error: 'Please wait before requesting another verification email' }, 429);
    }

    return c.json({
      message: 'If an account exists and is unverified, a verification email has been sent',
    });
  })
  .post('/logout', async (c) => {
    const session = c.get('session');

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
        emailVerified: user.emailVerified,
      },
    });
  });
