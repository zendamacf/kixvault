import { sneakers, sneakerWears } from '@kixvault/db';
import { and, count, eq, inArray, max } from 'drizzle-orm';
import { db } from './db';

type SneakerRow = typeof sneakers.$inferSelect;

export type WearStats = {
  wearCount: number;
  lastWornOn: string | null;
};

export async function getWearStatsForSneakerIds(
  sneakerIds: string[],
): Promise<Map<string, WearStats>> {
  if (sneakerIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      sneakerId: sneakerWears.sneakerId,
      wearCount: count(),
      lastWornOn: max(sneakerWears.wornOn),
    })
    .from(sneakerWears)
    .where(inArray(sneakerWears.sneakerId, sneakerIds))
    .groupBy(sneakerWears.sneakerId);

  return new Map(
    rows.map((row) => [
      row.sneakerId,
      { wearCount: Number(row.wearCount), lastWornOn: row.lastWornOn },
    ]),
  );
}

export type LogWearResult = {
  wear: { id: string; sneakerId: string; wornOn: string };
  /** False when the pair was already logged for that day. */
  created: boolean;
  /** True when the first wear moved a deadstock pair to lightly worn. */
  conditionChanged: boolean;
  sneaker: SneakerRow;
};

export async function logWear(
  userId: string,
  sneaker: SneakerRow,
  wornOn: string,
): Promise<LogWearResult> {
  return db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(sneakerWears)
      .values({ userId, sneakerId: sneaker.id, wornOn })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      const [existing] = await tx
        .select()
        .from(sneakerWears)
        .where(and(eq(sneakerWears.sneakerId, sneaker.id), eq(sneakerWears.wornOn, wornOn)));

      return {
        wear: { id: existing.id, sneakerId: existing.sneakerId, wornOn: existing.wornOn },
        created: false,
        conditionChanged: false,
        sneaker,
      };
    }

    let updatedSneaker = sneaker;
    let conditionChanged = false;

    if (sneaker.condition === 'deadstock') {
      const [updated] = await tx
        .update(sneakers)
        .set({ condition: 'lightly_worn' })
        .where(and(eq(sneakers.id, sneaker.id), eq(sneakers.condition, 'deadstock')))
        .returning();

      if (updated) {
        updatedSneaker = updated;
        conditionChanged = true;
      }
    }

    return {
      wear: { id: inserted.id, sneakerId: inserted.sneakerId, wornOn: inserted.wornOn },
      created: true,
      conditionChanged,
      sneaker: updatedSneaker,
    };
  });
}

export type RemoveWearResult = {
  removed: boolean;
  /** True when removing the only wear moved the pair back to deadstock. */
  conditionReverted: boolean;
  sneaker: SneakerRow;
};

export async function removeWear(
  userId: string,
  sneaker: SneakerRow,
  wornOn: string,
): Promise<RemoveWearResult> {
  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(sneakerWears)
      .where(
        and(
          eq(sneakerWears.userId, userId),
          eq(sneakerWears.sneakerId, sneaker.id),
          eq(sneakerWears.wornOn, wornOn),
        ),
      )
      .returning({ id: sneakerWears.id });

    if (deleted.length === 0) {
      return { removed: false, conditionReverted: false, sneaker };
    }

    const [{ remaining }] = await tx
      .select({ remaining: count() })
      .from(sneakerWears)
      .where(eq(sneakerWears.sneakerId, sneaker.id));

    if (Number(remaining) > 0) {
      return { removed: true, conditionReverted: false, sneaker };
    }

    const [reverted] = await tx
      .update(sneakers)
      .set({ condition: 'deadstock' })
      .where(and(eq(sneakers.id, sneaker.id), eq(sneakers.condition, 'lightly_worn')))
      .returning();

    return {
      removed: true,
      conditionReverted: Boolean(reverted),
      sneaker: reverted ?? sneaker,
    };
  });
}

export function todayUtc(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
