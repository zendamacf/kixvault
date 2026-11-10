import { describe, expect, test } from 'bun:test';
import { type AuditEvent, auditActions } from '@kixvault/shared';
import { actionLabel, dayKey, formatDayHeading, formatEventDetail, groupByDay } from './activity';

function event(overrides: Partial<AuditEvent> & { createdAt: string }): AuditEvent {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    action: 'sneaker.created',
    resourceType: 'sneaker',
    resourceId: null,
    metadata: null,
    ...overrides,
  };
}

// Local-time constructors keep these tests independent of the machine's time zone.
const now = new Date(2026, 10, 9, 12, 0);

describe('formatDayHeading', () => {
  test('labels the current day as Today', () => {
    expect(formatDayHeading(new Date(2026, 10, 9, 0, 5), now)).toBe('Today');
    expect(formatDayHeading(new Date(2026, 10, 9, 23, 55), now)).toBe('Today');
  });

  test('labels the previous day as Yesterday, including across a month boundary', () => {
    expect(formatDayHeading(new Date(2026, 10, 8, 18, 0), now)).toBe('Yesterday');
    expect(formatDayHeading(new Date(2026, 9, 31, 18, 0), new Date(2026, 10, 1, 9, 0))).toBe(
      'Yesterday',
    );
  });

  test('uses a long date for older days and hides the current year', () => {
    const heading = formatDayHeading(new Date(2026, 10, 5, 9, 0), now);

    expect(heading).not.toBe('Today');
    expect(heading).not.toBe('Yesterday');
    expect(heading).toContain('5');
    expect(heading).not.toContain('2026');
  });

  test('shows the year for dates in earlier years', () => {
    expect(formatDayHeading(new Date(2025, 11, 31, 9, 0), now)).toContain('2025');
  });
});

describe('groupByDay', () => {
  test('groups consecutive events from the same local day and keeps order', () => {
    const events = [
      event({ id: 'a', createdAt: new Date(2026, 10, 9, 22, 14).toISOString() }),
      event({ id: 'b', createdAt: new Date(2026, 10, 9, 8, 2).toISOString() }),
      event({ id: 'c', createdAt: new Date(2026, 10, 8, 21, 0).toISOString() }),
      event({ id: 'd', createdAt: new Date(2026, 10, 3, 10, 0).toISOString() }),
    ];

    const groups = groupByDay(events, now);

    expect(groups.map((group) => group.heading.slice(0, 9))).toEqual([
      'Today',
      'Yesterday',
      groups[2].heading.slice(0, 9),
    ]);
    expect(groups.map((group) => group.events.map((e) => e.id))).toEqual([
      ['a', 'b'],
      ['c'],
      ['d'],
    ]);
    expect(groups[0].key).toBe(dayKey(new Date(2026, 10, 9)));
  });

  test('returns no groups for no events', () => {
    expect(groupByDay([], now)).toEqual([]);
  });
});

describe('formatEventDetail', () => {
  const createdAt = new Date(2026, 10, 9).toISOString();

  test('has no detail for events without a pair', () => {
    expect(formatEventDetail(event({ action: 'auth.login', createdAt }))).toEqual({
      pair: null,
      note: null,
    });
  });

  test('names the pair when brand and model are recorded', () => {
    expect(
      formatEventDetail(event({ createdAt, metadata: { brand: 'Nike', model: 'Dunk Low' } })),
    ).toEqual({ pair: 'Nike Dunk Low', note: null });
  });

  test('notes when a grail was removed after copping it', () => {
    expect(
      formatEventDetail(
        event({
          action: 'sneaker.created_from_grail',
          createdAt,
          metadata: { brand: 'Nike', model: 'Dunk Low' },
        }),
      ),
    ).toEqual({ pair: 'Nike Dunk Low', note: 'Removed from Grails' });
  });

  test('counts grails when more than one was cleared', () => {
    expect(
      formatEventDetail(
        event({
          action: 'sneaker.created_from_grail',
          createdAt,
          metadata: { brand: 'Nike', model: 'Dunk Low', grailsCleared: 3 },
        }),
      ).note,
    ).toBe('Removed 3 grails from your list');
  });
});

describe('actionLabel', () => {
  test('resolves a human label for every audit action', () => {
    for (const action of auditActions) {
      expect(actionLabel(action)).not.toContain('activity.actions');
    }
  });
});
