import type { AuditAction, AuditEvent } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  LogIn,
  LogOut,
  type LucideIcon,
  Pencil,
  Plus,
  Star,
  Trash2,
  Trophy,
  UserPlus,
} from 'lucide-react';
import { BackLink } from '@/components/layout/back-link';
import { Skeleton } from '@/components/ui/skeleton';
import { auditEventsQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/activity')({
  component: ActivityPage,
});

const actionLabels: Record<AuditAction, string> = {
  'auth.login': 'Signed in',
  'auth.logout': 'Signed out',
  'auth.register': 'Created account',
  'grail.added': 'Added a grail',
  'sneaker.created': 'Added a pair',
  'sneaker.created_from_grail': 'Copped a grail',
  'sneaker.updated': 'Updated a pair',
  'sneaker.deleted': 'Removed a pair',
};

const actionIcons: Record<AuditAction, LucideIcon> = {
  'auth.login': LogIn,
  'auth.logout': LogOut,
  'auth.register': UserPlus,
  'grail.added': Star,
  'sneaker.created': Plus,
  'sneaker.created_from_grail': Trophy,
  'sneaker.updated': Pencil,
  'sneaker.deleted': Trash2,
};

function formatEventDetail(event: AuditEvent): { pair: string | null; note: string | null } {
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

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDayHeading(date: Date): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) {
    return 'Today';
  }

  if (dayKey(date) === dayKey(yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  });
}

function formatEventTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { timeStyle: 'short' });
}

type DayGroup = { key: string; heading: string; events: AuditEvent[] };

function groupByDay(events: AuditEvent[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const event of events) {
    const date = new Date(event.createdAt);
    const key = dayKey(date);
    const last = groups[groups.length - 1];

    if (last?.key === key) {
      last.events.push(event);
    } else {
      groups.push({ key, heading: formatDayHeading(date), events: [event] });
    }
  }

  return groups;
}

function ActivityPage() {
  const { data, isLoading, error } = useQuery(auditEventsQueryOptions);
  const events = data?.events ?? [];
  const retentionDays = data?.retentionDays ?? 90;
  const groups = groupByDay(events);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-4">
        <BackLink to="/">Back to collection</BackLink>
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Activity</h1>
          <p className="text-muted-foreground">
            Sign-ins, grails, and changes to your collection, newest first.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load activity. Try again in a moment.
        </p>
      ) : null}

      {!isLoading && !error && events.length === 0 ? (
        <div className="rounded-2xl bg-tile px-6 py-12 text-center ring-1 ring-border">
          <p className="font-heading text-lg font-semibold">Nothing here yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Signing in, adding grails and adding pairs will show up here.
          </p>
        </div>
      ) : null}

      {!isLoading && !error
        ? groups.map((group) => (
            <section key={group.key} className="space-y-3">
              <h2 className="font-display text-xl font-semibold tracking-tight">{group.heading}</h2>
              <ol className="divide-y divide-border rounded-2xl bg-tile ring-1 ring-border">
                {group.events.map((event) => {
                  const Icon = actionIcons[event.action];
                  const { pair, note } = formatEventDetail(event);
                  const date = new Date(event.createdAt);

                  return (
                    <li key={event.id} className="flex items-center gap-4 px-4 py-3.5">
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground"
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{actionLabels[event.action]}</p>
                        {pair ? (
                          <p className="truncate text-sm text-muted-foreground">{pair}</p>
                        ) : null}
                        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
                      </div>
                      <time
                        className="shrink-0 text-sm text-muted-foreground tabular-nums"
                        dateTime={event.createdAt}
                      >
                        {formatEventTime(date)}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        : null}

      <p className="text-sm text-muted-foreground">
        Activity older than {retentionDays} days is no longer shown.
      </p>
    </div>
  );
}
