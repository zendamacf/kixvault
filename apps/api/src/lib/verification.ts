import { createHash, randomBytes } from 'node:crypto';
import { emailVerificationTokens, users } from '@kixvault/db';
import { eq, lt } from 'drizzle-orm';
import { generateIdFromEntropySize } from 'lucia';
import { db } from './db';

const TOKEN_BYTES = 32;
const TOKEN_EXPIRY_HOURS = 48;
const RESEND_COOLDOWN_MS = 60_000;

const resendCooldowns = new Map<string, number>();

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export async function createVerificationToken(userId: string): Promise<string> {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));

  await db.insert(emailVerificationTokens).values({
    id: generateIdFromEntropySize(10),
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

export async function verifyEmailToken(
  rawToken: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const [tokenRecord] = await db
    .select({
      id: emailVerificationTokens.id,
      userId: emailVerificationTokens.userId,
      expiresAt: emailVerificationTokens.expiresAt,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, tokenHash));

  if (!tokenRecord) {
    return { success: false, error: 'Invalid or expired verification link' };
  }

  if (tokenRecord.expiresAt < now) {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, tokenRecord.id));
    return { success: false, error: 'Verification link has expired' };
  }

  await db
    .update(users)
    .set({ emailVerified: true, emailVerifiedAt: now })
    .where(eq(users.id, tokenRecord.userId));

  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, tokenRecord.userId));

  return { success: true };
}

export async function resendVerificationEmail(
  email: string,
): Promise<{ sent: boolean; rateLimited: boolean }> {
  const lastSent = resendCooldowns.get(email);
  const now = Date.now();

  if (lastSent && now - lastSent < RESEND_COOLDOWN_MS) {
    return { sent: false, rateLimited: true };
  }

  const [user] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.email, email));

  if (!user || user.emailVerified) {
    return { sent: false, rateLimited: false };
  }

  resendCooldowns.set(email, now);

  const rawToken = await createVerificationToken(user.id);
  const { sendVerificationEmail } = await import('./email');
  await sendVerificationEmail({ to: email, token: rawToken });

  return { sent: true, rateLimited: false };
}

export async function cleanupExpiredTokens(): Promise<void> {
  await db.delete(emailVerificationTokens).where(lt(emailVerificationTokens.expiresAt, new Date()));
}
