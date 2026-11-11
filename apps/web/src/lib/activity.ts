import type { AuditAction, AuditEvent } from '@kixvault/shared';
import { i18n } from '@/i18n';

/** Display label for an audit action. */
export function actionLabel(action: AuditAction): string {
  return i18n.t(`activity.actions.${action.replace('.', '_')}`);
}

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
          ? i18n.t('activity.grailsRemoved', { count: grailsCleared })
          : i18n.t('activity.grailsRemoved', { count: 1 }),
    };
  }

  if (event.action === 'sneaker.retired') {
    const departureType = event.metadata?.departureType;

    return {
      pair,
      note: typeof departureType === 'string' ? i18n.t(`departure.types.${departureType}`) : null,
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
    return i18n.t('activity.today');
  }

  if (dayKey(date) === dayKey(yesterday)) {
    return i18n.t('activity.yesterday');
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
