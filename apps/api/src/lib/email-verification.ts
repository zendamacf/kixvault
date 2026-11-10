import { createHash, randomBytes } from 'node:crypto';
import { emailVerificationTokens, users } from '@kixvault/db';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db } from './db';
import { getAppUrl } from './email/config';
import { sendEmail } from './email/send';
import { userEmailEquals } from './user-email';

export const VERIFICATION_TOKEN_TTL_HOURS = 24;
/** Minimum gap between verification emails for one account. Limits email flooding. */
export const VERIFICATION_RESEND_COOLDOWN_MS = 60_000;

/** SHA-256 of an emailed token. Only the hash is stored. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function buildVerifyUrl(token: string): string {
  return `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

/** Sends the verification email. Never throws: the user can ask for another link. */
export function sendVerificationEmail(
  to: string,
  token: string,
  locale?: string,
): Promise<boolean> {
  return sendEmail('verifyEmail', to, {
    verifyUrl: buildVerifyUrl(token),
    expiresInHours: VERIFICATION_TOKEN_TTL_HOURS,
    locale,
  });
}

/** Issues a fresh token for this user and removes their unused ones. */
export async function issueVerificationToken(userId: string, now = new Date()): Promise<string> {
  const token = generateToken();

  await db.transaction(async (tx) => {
    await tx
      .delete(emailVerificationTokens)
      .where(
        and(eq(emailVerificationTokens.userId, userId), isNull(emailVerificationTokens.usedAt)),
      );
    await tx.insert(emailVerificationTokens).values({
      userId,
      tokenHash: hashToken(token),
      createdAt: now,
      expiresAt: new Date(now.getTime() + VERIFICATION_TOKEN_TTL_HOURS * 3_600_000),
    });
  });

  return token;
}

/**
 * Issues a token for the unverified account with this email. Returns null, without saying why,
 * for unknown or verified accounts and for requests inside the cooldown.
 */
export async function createVerificationToken(
  email: string,
  now = new Date(),
): Promise<string | null> {
  const [user] = await db
    .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(userEmailEquals(email))
    .limit(1);

  if (!user || user.emailVerifiedAt) {
    return null;
  }

  const unused = await db
    .select({ createdAt: emailVerificationTokens.createdAt })
    .from(emailVerificationTokens)
    .where(
      and(eq(emailVerificationTokens.userId, user.id), isNull(emailVerificationTokens.usedAt)),
    );
  const mostRecent = Math.max(0, ...unused.map((row) => row.createdAt.getTime()));

  if (now.getTime() - mostRecent < VERIFICATION_RESEND_COOLDOWN_MS) {
    return null;
  }

  return issueVerificationToken(user.id, now);
}

/**
 * Claims the token (single use, not expired) and marks the account verified.
 * Returns the user id, or null for unknown, expired or used tokens.
 */
export async function consumeVerificationToken(
  token: string,
  now = new Date(),
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [claimed] = await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, hashToken(token)),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, now),
        ),
      )
      .returning({ userId: emailVerificationTokens.userId });

    if (!claimed) {
      return null;
    }

    await tx
      .update(users)
      .set({ emailVerifiedAt: now })
      .where(and(eq(users.id, claimed.userId), isNull(users.emailVerifiedAt)));
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.userId, claimed.userId),
          isNull(emailVerificationTokens.usedAt),
        ),
      );

    return claimed.userId;
  });
}
