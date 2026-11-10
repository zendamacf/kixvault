import { passwordResetTokens, users } from '@kixvault/db';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from './db';
import { getAppUrl } from './email/config';
import { sendEmail } from './email/send';
import { generateToken, hashToken } from './email-verification';
import { userEmailEquals } from './user-email';

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 60;
/** Minimum gap between reset emails for one account. Limits email flooding. */
export const PASSWORD_RESET_COOLDOWN_MS = 5 * 60_000;

export function buildResetUrl(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

/** Sends the reset email. Never throws: the user can ask for another link. */
export function sendPasswordResetEmail(
  to: string,
  token: string,
  locale?: string,
): Promise<boolean> {
  return sendEmail('resetPassword', to, {
    resetUrl: buildResetUrl(token),
    expiresInMinutes: PASSWORD_RESET_TOKEN_TTL_MINUTES,
    locale,
  });
}

/**
 * Issues a reset token for the verified account with this email. Returns null, without saying
 * why, for unknown or unverified accounts and for requests inside the cooldown. Any earlier
 * unused token is removed, so only the newest link works.
 */
export async function createPasswordResetToken(
  email: string,
  now = new Date(),
): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(userEmailEquals(email))
    .limit(1);

  if (!user?.emailVerifiedAt) {
    return null;
  }

  const unused = await db
    .select({ createdAt: passwordResetTokens.createdAt })
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
  const mostRecent = Math.max(0, ...unused.map((row) => row.createdAt.getTime()));

  if (now.getTime() - mostRecent < PASSWORD_RESET_COOLDOWN_MS) {
    return null;
  }

  const token = generateToken();

  await db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(and(eq(passwordResetTokens.userId, user.id), isNull(passwordResetTokens.usedAt)));
    await tx.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token),
      createdAt: now,
      expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60_000),
    });
  });

  return token;
}

/**
 * Claims the token (single use, not expired) and sets the new password hash. Returns the user
 * id, or null for unknown, expired or used tokens.
 */
export async function consumePasswordResetToken(
  token: string,
  passwordHash: string,
  now = new Date(),
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, hashToken(token)),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .returning({ userId: passwordResetTokens.userId });

    if (!claimed) {
      return null;
    }

    await tx.update(users).set({ passwordHash }).where(eq(users.id, claimed.userId));
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(eq(passwordResetTokens.userId, claimed.userId), isNull(passwordResetTokens.usedAt)),
      );

    return claimed.userId;
  });
}
