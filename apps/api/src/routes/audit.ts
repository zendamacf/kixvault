import { zValidator } from '@hono/zod-validator';
import type { AuditAction } from '@kixvault/shared';
import { AUDIT_EVENT_RETENTION_DAYS, listAuditEventsQuerySchema } from '@kixvault/shared';
import { Hono } from 'hono';
import { listAuditEventsForUser } from '../lib/audit';
import { requireAuth, sessionMiddleware } from '../middleware/session';
import type { ApiEnv } from '../types';

export const auditRoutes = new Hono<ApiEnv>()
  .use(sessionMiddleware)
  .use(requireAuth)
  .get('/', zValidator('query', listAuditEventsQuerySchema), async (c) => {
    const user = c.get('user');
    const query = c.req.valid('query');

    const rows = await listAuditEventsForUser(user?.id ?? '', {
      limit: query.limit,
      offset: query.offset,
    });

    const events = rows.map((row) => ({
      id: row.id,
      action: row.action as AuditAction,
      resourceType: row.resourceType as 'sneaker' | 'session' | 'grail' | null,
      resourceId: row.resourceId,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    }));

    return c.json({
      events,
      retentionDays: AUDIT_EVENT_RETENTION_DAYS,
    });
  });
