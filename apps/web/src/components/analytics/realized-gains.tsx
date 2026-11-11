import type { RealizedSummary } from '@kixvault/shared';
import { Link } from '@tanstack/react-router';
import { Trans, useTranslation } from 'react-i18next';
import { formatDepartureDate } from '@/lib/departure';
import { cn, formatCurrency, formatGainLoss } from '@/lib/utils';

/** Realized gain or loss on sold pairs, with one row per sale. Kept apart from unrealized value. */
export function RealizedGains({ realized }: { realized: RealizedSummary }) {
  const { t } = useTranslation();
  const { totalGainLoss, soldCount, sales } = realized;

  return (
    <div className="space-y-4">
      <p className="font-heading text-2xl leading-[1.2] tracking-tight text-muted-foreground">
        {totalGainLoss != null ? (
          <Trans
            i18nKey="analytics.realized.total"
            count={soldCount}
            values={{
              change:
                totalGainLoss === 0
                  ? t('analytics.realized.breakEven')
                  : t(totalGainLoss > 0 ? 'analytics.realized.up' : 'analytics.realized.down', {
                      amount: formatCurrency(Math.abs(totalGainLoss)),
                    }),
            }}
            components={{
              tone: (
                <span
                  className={cn(
                    'font-semibold',
                    totalGainLoss > 0 && 'text-gain',
                    totalGainLoss < 0 && 'text-loss',
                  )}
                />
              ),
              strong: <strong className="font-semibold text-foreground" />,
            }}
          />
        ) : (
          <Trans
            i18nKey="analytics.realized.totalUnknown"
            count={soldCount}
            components={{ strong: <strong className="font-semibold text-foreground" /> }}
          />
        )}
      </p>

      <ul aria-label={t('analytics.realized.listLabel')} className="divide-y divide-border">
        {sales.map((sale) => (
          <li
            key={sale.sneakerId}
            className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Link
                to="/sneakers/$sneakerId"
                params={{ sneakerId: sale.sneakerId }}
                search={{ from: 'analytics' }}
                className="block truncate rounded-sm text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
              >
                {sale.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {sale.purchasePrice != null
                  ? t('analytics.realized.rowDetail', {
                      date: formatDepartureDate(sale.departedOn),
                      sold: formatCurrency(sale.salePrice),
                      paid: formatCurrency(sale.purchasePrice),
                    })
                  : t('analytics.realized.rowDetailNoCost', {
                      date: formatDepartureDate(sale.departedOn),
                      sold: formatCurrency(sale.salePrice),
                    })}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 text-sm font-medium tabular-nums',
                sale.gainLoss != null && sale.gainLoss > 0 && 'text-gain',
                sale.gainLoss != null && sale.gainLoss < 0 && 'text-loss',
                (sale.gainLoss == null || sale.gainLoss === 0) && 'text-muted-foreground',
              )}
            >
              {sale.gainLoss != null
                ? formatGainLoss(sale.gainLoss)
                : t('analytics.realized.noCost')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
