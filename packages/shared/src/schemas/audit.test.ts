import { describe, expect, test } from 'bun:test';
import { AUDIT_EVENT_RETENTION_DAYS, listAuditEventsQuerySchema } from './audit';

describe('audit schemas', () => {
  test('AUDIT_EVENT_RETENTION_DAYS is 90', () => {
    expect(AUDIT_EVENT_RETENTION_DAYS).toBe(90);
  });

  test('listAuditEventsQuerySchema applies defaults', () => {
    expect(listAuditEventsQuerySchema.parse({})).toEqual({ limit: 50, offset: 0 });
  });
});
