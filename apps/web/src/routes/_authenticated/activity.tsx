import type { AuditAction, AuditEvent } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { BackLink } from '@/components/layout/back-link';
import { auditEventsQueryOptions } from '@/lib/queries';
import { cn } from '@/lib/utils';

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

function formatEventDescription(event: AuditEvent): string {
  const brand = event.metadata?.brand;
  const model = event.metadata?.model;
  const grailsCleared = event.metadata?.grailsCleared;

  if (typeof brand === 'string' && typeof model === 'string') {
    const pair = `${brand} ${model}`;

    if (event.action === 'sneaker.created_from_grail') {
      if (typeof grailsCleared === 'number' && grailsCleared > 1) {
        return `${pair} · Removed ${grailsCleared} grails from your list`;
      }

      return `${pair} · Removed from Grails`;
    }

    return pair;
  }

  return actionLabels[event.action];
}

function formatEventTime(iso: string): string {
  const date = new Date(iso);

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function ActivityPage() {
  const { data, isLoading, error } = useQuery(auditEventsQueryOptions);
  const events = data?.events ?? [];
  const retentionDays = data?.retentionDays ?? 90;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackLink to="/">← Back to collection</BackLink>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
          <p className="text-sm text-muted-foreground">
            A timeline of sign-ins, grails, and changes to your collection.
          </p>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading activity…</p> : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load activity. Try again in a moment.
        </p>
      ) : null}

      {!isLoading && !error && events.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No activity yet. Actions like signing in, adding grails, or adding sneakers will show up
          here.
        </p>
      ) : null}

      {!isLoading && !error && events.length > 0 ? (
        <ol className="space-y-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{actionLabels[event.action]}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {formatEventDescription(event)}
                </p>
              </div>
              <time
                className={cn('shrink-0 text-xs text-muted-foreground sm:text-sm')}
                dateTime={event.createdAt}
              >
                {formatEventTime(event.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Activity older than {retentionDays} days is no longer shown.{' '}
        <Link to="/" className="underline-offset-4 hover:underline">
          Return to your collection
        </Link>
        .
      </p>
    </div>
  );
}
