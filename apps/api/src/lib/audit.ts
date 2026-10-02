import { auditEvents } from '@kixvault/db';
import type { AuditAction, AuditResourceType } from '@kixvault/shared';
import { AUDIT_EVENT_RETENTION_DAYS } from '@kixvault/shared';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db } from './db';

export type RecordAuditEventInput = {
  userId: string;
  action: AuditAction;
  resourceType?: AuditResourceType;
  resourceId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  ip?: string;
};

export async function recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
  await db.insert(auditEvents).values({
    userId: input.userId,
    action: input.action,
    resourceType: input.resourceType ?? null,
    resourceId: input.resourceId ?? null,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
  });
}

export function getAuditRetentionCutoff(now = new Date()): Date {
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - AUDIT_EVENT_RETENTION_DAYS);
  return cutoff;
}

export async function listAuditEventsForUser(
  userId: string,
  options: { limit: number; offset: number },
) {
  const cutoff = getAuditRetentionCutoff();

  const rows = await db
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      resourceType: auditEvents.resourceType,
      resourceId: auditEvents.resourceId,
      metadata: auditEvents.metadata,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(and(eq(auditEvents.userId, userId), gte(auditEvents.createdAt, cutoff)))
    .orderBy(desc(auditEvents.createdAt))
    .limit(options.limit)
    .offset(options.offset);

  return rows;
}

export function formatSneakerAuditMetadata(sneaker: {
  brand: string;
  model: string;
}): Record<string, string> {
  return {
    brand: sneaker.brand,
    model: sneaker.model,
  };
}

export type ClearedGrailAuditSummary = {
  brand: string;
  model: string;
};

export async function recordSneakerCreatedAuditEvent(input: {
  userId: string;
  sneaker: { id: string; brand: string; model: string };
  clearedGrails: ClearedGrailAuditSummary[];
  ip?: string;
}): Promise<void> {
  const fromGrail = input.clearedGrails.length > 0;

  await recordAuditEvent({
    userId: input.userId,
    action: fromGrail ? 'sneaker.created_from_grail' : 'sneaker.created',
    resourceType: 'sneaker',
    resourceId: input.sneaker.id,
    metadata: {
      ...formatSneakerAuditMetadata(input.sneaker),
      ...(fromGrail ? { grailsCleared: input.clearedGrails.length } : {}),
    },
    ip: input.ip,
  });
}
