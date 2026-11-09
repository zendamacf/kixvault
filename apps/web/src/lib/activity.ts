import type { AuditAction, AuditEvent } from '@kixvault/shared';

export const actionLabels: Record<AuditAction, string> = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'auth.register': 'Created account',
  'grail.added': 'Added a grail',
  'sneaker.created': 'Added a pair',
  'sneaker.created_from_grail': 'Copped a grail',
  'sneaker.updated': 'Updated a pair',
  'sneaker.deleted': 'Removed a pair',
  'sneaker.worn': 'Logged a wear',
  'sneaker.wear_removed': 'Removed a wear',
};

/** The pair an event is about, plus an extra note for events that clear grails. */
export function formatEventDetail(event: AuditEvent): { pair: string | null; note: string | null } {
  const brand = event.metadata?.brand;
  const model = event.metadata?.model;
  const grailsCleared = event.metadata?.grailsCleared;

  if (typeof brand !== 'string' || typeof model !== 'string') {
    return { pair: null, note: null };
  }

  const pair = `${brand} ${model}`;

  if (event.action === 'sneaker.created_from_grail') {
    return {
      pair,
      note:
        typeof grailsCleared === 'number' && grailsCleared > 1
          ? `Removed ${grailsCleared} grails from your list`
          : 'Removed from Grails',
    };
  }

  return { pair, note: null };
}

/** Local calendar day, so events group by the day the viewer experienced them. */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** "Today", "Yesterday", or a long date. The year is only shown for earlier years. */
export function formatDayHeading(date: Date, now: Date = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (dayKey(date) === dayKey(now)) {
    return 'Today';
  }

  if (dayKey(date) === dayKey(yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
}

export function formatEventTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { timeStyle: 'short' });
}

export type DayGroup = { key: string; heading: string; events: AuditEvent[] };

/** Groups events under day headings, keeping the order they arrive in (newest first). */
export function groupByDay(events: AuditEvent[], now: Date = new Date()): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const event of events) {
    const date = new Date(event.createdAt);
    const key = dayKey(date);
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, heading: formatDayHeading(date, now), events: [event] });
    }
  }

  return groups;
}
