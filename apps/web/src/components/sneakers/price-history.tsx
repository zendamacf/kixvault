import type { PriceSnapshotEntry } from '@kixvault/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PriceHistoryChart } from './price-history-chart';

type PriceHistoryView = 'chart' | 'table';

type PriceHistoryProps = {
  history: PriceSnapshotEntry[];
  purchasePrice?: number | null;
};

/** Shows stored market price snapshots for a sneaker as a chart or a table. */
export function PriceHistory({ history, purchasePrice }: PriceHistoryProps) {
  const { t } = useTranslation();
  const [view, setView] = useState<PriceHistoryView>('chart');

  const viewOptions: { value: PriceHistoryView; label: string }[] = [
    { value: 'chart', label: t('priceHistory.chart') },
    { value: 'table', label: t('priceHistory.table') },
  ];

  if (history.length === 0) {
    return (
      <p className="rounded-2xl bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-border">
        {t('priceHistory.empty')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <SegmentedControl
        label={t('priceHistory.viewLabel')}
        value={view}
        options={viewOptions}
        onChange={setView}
      />
      {view === 'chart' ? (
        <PriceHistoryChart history={history} purchasePrice={purchasePrice} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{t('priceHistory.date')}</th>
                <th className="px-4 py-2.5 text-right font-medium">{t('priceHistory.price')}</th>
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
      )}
    </div>
  );
}
