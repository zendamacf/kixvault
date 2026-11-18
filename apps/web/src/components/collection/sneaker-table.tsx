import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sneaker } from '@/lib/queries';
import { cn, formatCondition, formatCurrency, formatDate, formatGainLoss } from '@/lib/utils';

type Column = 'pair' | 'size' | 'condition' | 'paid' | 'value' | 'gain' | 'wears' | 'added';

/** The column each sort field orders by, so the table can mark it. */
const SORT_COLUMN: Record<string, Column> = {
  brand: 'pair',
  purchase_price: 'paid',
  wear_count: 'wears',
  created_at: 'added',
};

const CELL = 'px-4 py-3 whitespace-nowrap';
const NUMERIC = 'text-right tabular-nums';
const SORTED = 'bg-muted/70 font-medium text-foreground';

type SneakerTableProps = {
  sneakers: Sneaker[];
  /** The active collection sort field; its column is highlighted. */
  sortField?: string;
};

/** One row per pair for comparing pairs side by side. */
export function SneakerTable({ sneakers, sortField }: SneakerTableProps) {
  const { t } = useTranslation();
  const sortedColumn = sortField ? SORT_COLUMN[sortField] : undefined;

  const headers: { column: Column; label: string; align?: 'right' }[] = [
    { column: 'pair', label: t('collection.table.pair') },
    { column: 'size', label: t('collection.table.size'), align: 'right' },
    { column: 'condition', label: t('collection.table.condition') },
    { column: 'paid', label: t('collection.table.paid'), align: 'right' },
    { column: 'value', label: t('collection.table.value'), align: 'right' },
    { column: 'gain', label: t('collection.table.gain'), align: 'right' },
    { column: 'wears', label: t('collection.table.wears'), align: 'right' },
    { column: 'added', label: t('collection.table.added'), align: 'right' },
  ];

  /** Sorted-by column cells get a band and stronger text; the rest stay muted. */
  function cellClass(column: Column, extra?: string) {
    return cn(
      CELL,
      column !== 'pair' && 'text-muted-foreground',
      column !== 'pair' && column !== 'condition' && NUMERIC,
      column === sortedColumn && SORTED,
      extra,
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-border">
      <table className="w-full min-w-[56rem] text-sm">
        <caption className="sr-only">{t('collection.pairsLabel')}</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            {headers.map((header) => (
              <th
                key={header.column}
                scope="col"
                aria-sort={header.column === sortedColumn ? 'other' : undefined}
                className={cn(
                  'px-4 py-3 text-sm font-normal whitespace-nowrap',
                  header.align === 'right' ? 'text-right' : 'text-left',
                  header.column === sortedColumn && SORTED,
                )}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sneakers.map((sneaker) => {
            const subtitle = sneaker.nickname
              ? `"${sneaker.nickname}"`
              : sneaker.colorway || t('common.noColorway');

            return (
              <tr
                key={sneaker.id}
                className="border-b border-border/60 last:border-b-0 hover:bg-muted/40"
              >
                <td className={cn(CELL, 'w-full max-w-0', sortedColumn === 'pair' && SORTED)}>
                  <Link
                    to="/sneakers/$sneakerId"
                    params={{ sneakerId: sneaker.id }}
                    className="flex items-center gap-4 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <SneakerThumbnail
                      imageUrl={sneaker.primaryImage?.url ?? null}
                      alt=""
                      className="h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-lg bg-muted/60 object-contain p-1"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-heading text-base font-semibold">
                        <span className="font-normal text-muted-foreground">{sneaker.brand}</span>{' '}
                        {sneaker.model}
                      </span>
                      <span className="block truncate text-muted-foreground">{subtitle}</span>
                    </span>
                  </Link>
                </td>
                <td className={cellClass('size')}>{sneaker.size}</td>
                <td className={cellClass('condition')}>{formatCondition(sneaker.condition)}</td>
                <td className={cellClass('paid')}>{formatCurrency(sneaker.purchasePrice)}</td>
                <td className={cellClass('value')}>
                  {sneaker.currentMarketPrice != null
                    ? formatCurrency(sneaker.currentMarketPrice)
                    : t('common.emptyValue')}
                </td>
                <td
                  className={cn(
                    cellClass('gain'),
                    sneaker.gainLoss != null && sneaker.gainLoss > 0 && 'font-medium text-gain',
                    sneaker.gainLoss != null && sneaker.gainLoss < 0 && 'font-medium text-loss',
                  )}
                >
                  {sneaker.gainLoss != null
                    ? formatGainLoss(sneaker.gainLoss)
                    : t('common.emptyValue')}
                </td>
                <td className={cellClass('wears')}>{sneaker.wearCount}</td>
                <td className={cellClass('added')}>{formatDate(sneaker.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Loading skeleton for the collection table. */
export function SneakerTableSkeleton() {
  return (
    <div aria-hidden className="space-y-px overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => (
        <div key={id} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-12 w-[4.5rem] rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3.5 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
