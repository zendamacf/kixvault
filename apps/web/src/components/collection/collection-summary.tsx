import { Trans, useTranslation } from 'react-i18next';
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

function Figure({ children }: { children?: React.ReactNode }) {
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
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <section aria-label={t('collection.summary.label')} className="space-y-3">
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
    <section aria-label={t('collection.summary.label')} className="space-y-2">
      <p className="max-w-4xl text-balance font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
        <Trans
          i18nKey="collection.summary.pairs"
          count={count}
          components={{ figure: <Figure /> }}
        />
        {totalSpend > 0 ? (
          <Trans
            i18nKey="collection.summary.boughtFor"
            values={{ value: formatCurrency(totalSpend) }}
            components={{ figure: <Figure /> }}
          />
        ) : null}
        {totalMarketValue != null ? (
          <Trans
            i18nKey="collection.summary.worth"
            values={{ value: formatCurrency(totalMarketValue) }}
            components={{ figure: <Figure /> }}
          />
        ) : (
          t('collection.summary.noWorth')
        )}
        {totalGainLoss != null ? (
          <span className={`${gainClassName} whitespace-nowrap`}>
            {' '}
            {totalGainLoss === 0 ? (
              t('collection.summary.breakEven')
            ) : (
              <Trans
                i18nKey={totalGainLoss > 0 ? 'collection.summary.up' : 'collection.summary.down'}
                values={{ amount: formatCurrency(Math.abs(totalGainLoss)) }}
                components={{ strong: <strong className="font-semibold" /> }}
              />
            )}
          </span>
        ) : null}
      </p>
      {avgSpend > 0 ? (
        <p className="text-sm text-muted-foreground">
          {t('collection.summary.average', { value: formatCurrency(avgSpend) })}
        </p>
      ) : null}
    </section>
  );
}
