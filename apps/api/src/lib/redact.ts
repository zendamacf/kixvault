/** Env vars whose values must never reach logs, Sentry or error messages. */
const SECRET_ENV_VARS = [
  'DATABASE_URL',
  'TEST_DATABASE_URL',
  'REDIS_URL',
  'KICKSDB_API_KEY',
  'RESEND_API_KEY',
  'SENTRY_AUTH_TOKEN',
] as const;

const REDACTED = '[REDACTED]';

/** Ignore very short values (e.g. dev placeholders) so redaction doesn't mangle ordinary text. */
const MIN_SECRET_LENGTH = 8;

function secretValues(): string[] {
  const values = new Set<string>();
  for (const name of SECRET_ENV_VARS) {
    const value = process.env[name]?.trim();
    if (!value) continue;
    values.add(value);
    if (name.endsWith('_URL')) {
      try {
        const { password } = new URL(value);
        if (password) {
          values.add(password);
          values.add(decodeURIComponent(password));
        }
      } catch {
        // Not a parseable URL; the full value is already covered.
      }
    }
  }
  // Longest first so a full URL is replaced before its embedded password.
  return [...values]
    .filter((v) => v.length >= MIN_SECRET_LENGTH)
    .sort((a, b) => b.length - a.length);
}

export function redactSecrets(text: string): string {
  let out = text;
  for (const secret of secretValues()) out = out.replaceAll(secret, REDACTED);
  // Resend-style keys, even if the env value was rotated mid-flight.
  out = out.replace(/\bre_[A-Za-z0-9_]{8,}\b/g, REDACTED);
  // Credentials embedded in any connection string.
  return out.replace(/\b((?:postgres(?:ql)?|rediss?):\/\/[^:\s/@]*):[^@\s]+@/gi, `$1:${REDACTED}@`);
}

/** Deep-redacts a JSON-serializable value (used for Sentry events). */
export function redactDeep<T>(value: T): T {
  try {
    return JSON.parse(redactSecrets(JSON.stringify(value))) as T;
  } catch {
    return value;
  }
}
