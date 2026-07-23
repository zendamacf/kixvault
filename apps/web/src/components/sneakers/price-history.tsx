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
    <div className="overflow-hidden rounded-md">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/20 text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">Date</th>
            <th className="px-3 py-2 text-right font-medium">Price</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr
              key={entry.snapshotDate}
              className="border-b border-border last:border-b-0 odd:bg-background/60 even:bg-muted/30"
            >
              <td className="px-3 py-2 text-muted-foreground">{formatDate(entry.snapshotDate)}</td>
              <td className="px-3 py-2 text-right font-medium">{formatCurrency(entry.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
