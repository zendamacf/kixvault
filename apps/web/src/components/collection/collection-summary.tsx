import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

type CollectionSummaryProps = {
  count?: number;
  totalSpend?: number;
  avgSpend?: number;
  totalMarketValue?: number | null;
  totalGainLoss?: number | null;
  isLoading?: boolean;
};

function Figure({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

/** One-sentence read on what the collection cost and what it is worth today. */
export function CollectionSummary({
  count = 0,
  totalSpend = 0,
  avgSpend = 0,
  totalMarketValue = null,
  totalGainLoss = null,
  isLoading,
}: CollectionSummaryProps) {
  if (isLoading) {
    return (
      <section aria-label="Collection summary" className="space-y-3">
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-9 w-2/3 max-w-sm" />
      </section>
    );
  }

  if (count === 0) {
    return null;
  }

  const gainClassName =
    totalGainLoss == null || totalGainLoss === 0
      ? 'text-muted-foreground'
      : totalGainLoss > 0
        ? 'text-gain'
        : 'text-loss';

  return (
    <section aria-label="Collection summary" className="space-y-2">
      <p className="max-w-4xl text-balance font-display text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
        <Figure>{count}</Figure> {count === 1 ? 'pair' : 'pairs'}, bought for{' '}
        <Figure>{formatCurrency(totalSpend)}</Figure>
        {totalMarketValue != null ? (
          <>
            , worth <Figure>{formatCurrency(totalMarketValue)}</Figure> today.
          </>
        ) : (
          '.'
        )}
        {totalGainLoss != null ? (
          <span className={`${gainClassName} whitespace-nowrap`}>
            {' '}
            {totalGainLoss === 0 ? (
              'Break-even.'
            ) : (
              <>
                {totalGainLoss > 0 ? 'Up ' : 'Down '}
                <strong className="font-semibold">{formatCurrency(Math.abs(totalGainLoss))}</strong>
                .
              </>
            )}
          </span>
        ) : null}
      </p>
      <p className="text-sm text-muted-foreground">{formatCurrency(avgSpend)} average per pair</p>
    </section>
  );
}
