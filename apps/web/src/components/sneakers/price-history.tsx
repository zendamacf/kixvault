import type { PriceSnapshotEntry } from '@kixvault/shared';
import { formatCurrency, formatDate } from '@/lib/utils';

type PriceHistoryProps = {
  history: PriceSnapshotEntry[];
};

/** Lists stored market price snapshots for a sneaker. */
export function PriceHistory({ history }: PriceHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Price history will appear after market values are recorded.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {history.map((entry) => (
        <li
          key={entry.snapshotDate}
          className="flex items-center justify-between gap-4 rounded-md border border-border bg-background/60 px-3 py-2 text-sm"
        >
          <span className="text-muted-foreground">{formatDate(entry.snapshotDate)}</span>
          <span className="font-medium">{formatCurrency(entry.price)}</span>
        </li>
      ))}
    </ul>
  );
}
