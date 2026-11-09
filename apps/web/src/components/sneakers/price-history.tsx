import type { PriceSnapshotEntry } from '@kixvault/shared';
import { formatCurrency, formatDate } from '@/lib/utils';

type PriceHistoryProps = {
  history: PriceSnapshotEntry[];
};

/** Lists stored market price snapshots for a sneaker. */
export function PriceHistory({ history }: PriceHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="rounded-2xl bg-tile px-4 py-6 text-sm text-muted-foreground ring-1 ring-border">
        Price history will appear after market values are recorded.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-tile ring-1 ring-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left text-muted-foreground">
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry.snapshotDate} className="border-b border-border last:border-b-0">
              <td className="px-4 py-2.5 text-muted-foreground">
                {formatDate(entry.snapshotDate)}
              </td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                {formatCurrency(entry.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
