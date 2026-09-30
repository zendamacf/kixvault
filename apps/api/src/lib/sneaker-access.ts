import { sneakers } from '@kixvault/db';
import { eq } from 'drizzle-orm';
import { db } from './db';

export async function getSneakerOwnerId(sneakerId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: sneakers.userId })
    .from(sneakers)
    .where(eq(sneakers.id, sneakerId));

  return row?.userId ?? null;
}
