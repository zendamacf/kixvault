import { Trans, useTranslation } from 'react-i18next';
import type { Sneaker } from '@/lib/queries';
import { formatCurrency } from '@/lib/utils';

function Figure({ children }: { children?: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

/** What has left the vault, what the sold pairs fetched, and the realized gain or loss. */
export function summarizeHistory(sneakers: Sneaker[]) {
  const sold = sneakers.filter((sneaker) => sneaker.departureType === 'sold');
  const withGain = sold.filter((sneaker) => sneaker.realizedGainLoss != null);

  return {
    count: sneakers.length,
    soldCount: sold.length,
    soldTotal: sold.reduce((sum, sneaker) => sum + (sneaker.salePrice ?? 0), 0),
    realizedGainLoss:
      withGain.length > 0
        ? withGain.reduce((sum, sneaker) => sum + (sneaker.realizedGainLoss ?? 0), 0)
        : null,
  };
}

export function HistorySummary({ sneakers }: { sneakers: Sneaker[] }) {
  const { t } = useTranslation();
  const { count, soldCount, soldTotal, realizedGainLoss } = summarizeHistory(sneakers);

  const gainClassName =
    realizedGainLoss == null || realizedGainLoss === 0
      ? 'text-muted-foreground'
      : realizedGainLoss > 0
        ? 'text-gain'
        : 'text-loss';

  return (
    <section aria-label={t('history.summaryLabel')}>
      <p className="max-w-4xl text-balance font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
        <Trans i18nKey="history.pairs" count={count} components={{ figure: <Figure /> }} />
        {soldCount > 0 ? (
          <Trans
            i18nKey="history.soldFor"
            values={{ count: soldCount, value: formatCurrency(soldTotal) }}
            components={{ figure: <Figure /> }}
          />
        ) : (
          t('history.noSales')
        )}
        {realizedGainLoss != null ? (
          <span className={gainClassName}>
            {' '}
            {realizedGainLoss === 0 ? (
              t('history.realizedEven')
            ) : (
              <Trans
                i18nKey={realizedGainLoss > 0 ? 'history.realizedUp' : 'history.realizedDown'}
                values={{ amount: formatCurrency(Math.abs(realizedGainLoss)) }}
                components={{ strong: <strong className="font-semibold" /> }}
              />
            )}
          </span>
        ) : null}
      </p>
    </section>
  );
}
