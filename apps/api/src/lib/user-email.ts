import { users } from '@kixvault/db';
import { eq, sql } from 'drizzle-orm';

/** Case-insensitive match on the stored address. Older accounts may have mixed case. */
export function userEmailEquals(email: string) {
  return eq(sql`lower(${users.email})`, email.trim().toLowerCase());
}
