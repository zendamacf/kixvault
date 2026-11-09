import { z } from 'zod';
import type { SneakerCondition } from '../types';

export const MAX_WEAR_RANGE_DAYS = 100;

function daysBetween(from: string, to: string): number {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
}

const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), 'Invalid date');

export const logWearSchema = z.object({
  /** Local calendar day of the wear. The server uses today (UTC) when omitted. */
  wornOn: isoDate.optional(),
});

export const listWearsQuerySchema = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .refine((value) => value.from <= value.to, { message: 'from must not be after to' })
  .refine((value) => daysBetween(value.from, value.to) <= MAX_WEAR_RANGE_DAYS, {
    message: `Range must not exceed ${MAX_WEAR_RANGE_DAYS} days`,
  });

export const wearEntrySchema = z.object({
  id: z.string().uuid(),
  sneakerId: z.string().uuid(),
  wornOn: z.string(),
});

export type LogWearInput = z.infer<typeof logWearSchema>;
export type ListWearsQuery = z.infer<typeof listWearsQuerySchema>;
export type WearEntry = z.infer<typeof wearEntrySchema>;

/** Wears needed before the next condition is suggested. */
export const WEAR_CONDITION_THRESHOLDS = {
  worn: 15,
  beat: 40,
} as const;

/**
 * Returns the condition to suggest for a pair, or null when the current one still fits.
 * Never suggests a better condition. The first wear of a deadstock pair is handled
 * automatically by the API, so deadstock is included here only for completeness.
 */
export function suggestCondition(
  condition: SneakerCondition,
  wearCount: number,
): SneakerCondition | null {
  if (condition === 'deadstock') {
    return wearCount >= 1 ? 'lightly_worn' : null;
  }

  if (condition === 'lightly_worn') {
    return wearCount >= WEAR_CONDITION_THRESHOLDS.worn ? 'worn' : null;
  }

  if (condition === 'worn') {
    return wearCount >= WEAR_CONDITION_THRESHOLDS.beat ? 'beat' : null;
  }

  return null;
}

/** Allows today and one day ahead, so users east of UTC can log their local "today". */
export function isWearDateAllowed(wornOn: string, now = new Date()): boolean {
  const limit = new Date(now);
  limit.setUTCDate(limit.getUTCDate() + 1);

  return wornOn <= limit.toISOString().slice(0, 10);
}
