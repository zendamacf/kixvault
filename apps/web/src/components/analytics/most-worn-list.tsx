import type { MostWornEntry } from '@kixvault/shared';
import { Link } from '@tanstack/react-router';

/** Ranked list of the most-worn pairs, with proportional bars. */
export function MostWornList({ entries }: { entries: MostWornEntry[] }) {
  const max = Math.max(...entries.map((entry) => entry.count), 1);

  return (
    <ol className="space-y-3">
      {entries.map((entry, index) => (
        <li key={entry.sneakerId} className="space-y-1">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <Link
              to="/sneakers/$sneakerId"
              params={{ sneakerId: entry.sneakerId }}
              search={{ from: 'analytics' }}
              className="min-w-0 truncate rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
              {entry.name}
            </Link>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {entry.count} {entry.count === 1 ? 'wear' : 'wears'}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-chart-5"
              style={{ width: `${(entry.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
