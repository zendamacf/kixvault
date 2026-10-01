import { z } from 'zod';

export const auditActions = [
  'auth.login',
  'auth.logout',
  'auth.register',
  'sneaker.created',
  'sneaker.updated',
  'sneaker.deleted',
] as const;

export type AuditAction = (typeof auditActions)[number];

export const auditResourceTypes = ['sneaker', 'session'] as const;
export type AuditResourceType = (typeof auditResourceTypes)[number];

export const auditEventMetadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export const listAuditEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const auditEventSchema = z.object({
  id: z.string().uuid(),
  action: z.enum(auditActions),
  resourceType: z.enum(auditResourceTypes).nullable(),
  resourceId: z.string().nullable(),
  metadata: auditEventMetadataSchema.nullable(),
  createdAt: z.string(),
});

export const listAuditEventsResponseSchema = z.object({
  events: z.array(auditEventSchema),
  retentionDays: z.number().int().positive(),
});

export type ListAuditEventsQuery = z.infer<typeof listAuditEventsQuerySchema>;
export type AuditEvent = z.infer<typeof auditEventSchema>;
export type ListAuditEventsResponse = z.infer<typeof listAuditEventsResponseSchema>;

/** How long account activity stays visible before it is no longer returned. */
export const AUDIT_EVENT_RETENTION_DAYS = 90;
