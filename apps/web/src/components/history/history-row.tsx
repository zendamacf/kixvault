import type { DepartureType } from '@kixvault/shared';
import { Link } from '@tanstack/react-router';
import { ArchiveRestore } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Button } from '@/components/ui/button';
import { formatDepartureDate, formatDepartureType } from '@/lib/departure';
import type { Sneaker } from '@/lib/queries';
import { cn, formatCurrency, formatGainLoss } from '@/lib/utils';

type HistoryRowProps = {
  sneaker: Sneaker;
  onRestore: (sneaker: Sneaker) => void;
  isRestoring?: boolean;
};

/** One retired pair in the history ledger: what it was, how it left, and what it fetched. */
export function HistoryRow({ sneaker, onRestore, isRestoring }: HistoryRowProps) {
  const { t } = useTranslation();
  const name = `${sneaker.brand} ${sneaker.model}`;
  const departureType = sneaker.departureType as DepartureType;
  const subtitle = sneaker.nickname
    ? `"${sneaker.nickname}"`
    : sneaker.colorway || t('common.noColorway');
  const gain = sneaker.realizedGainLoss;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap">
      <Link
        to="/sneakers/$sneakerId"
        params={{ sneakerId: sneaker.id }}
        search={{ from: 'history' }}
        className="group flex min-w-0 flex-1 basis-full items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:basis-auto"
      >
        <SneakerThumbnail
          imageUrl={sneaker.primaryImage?.url ?? null}
          alt=""
          className="size-16 shrink-0 rounded-lg bg-background p-1.5 ring-1 ring-border"
        />
        <span className="min-w-0 space-y-0.5">
          <span className="block truncate font-heading text-base leading-snug font-semibold group-hover:underline">
            <span className="font-normal text-muted-foreground">{sneaker.brand}</span>{' '}
            {sneaker.model}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {subtitle}
            {' · '}
            {t('common.size', { size: sneaker.size })}
          </span>
        </span>
      </Link>

      <p className="text-sm sm:w-40 sm:shrink-0">
        {t('history.departedOn', {
          type: formatDepartureType(departureType),
          date: formatDepartureDate(sneaker.departedOn),
        })}
      </p>

      <div className="ml-auto text-right sm:w-28 sm:shrink-0">
        {sneaker.salePrice != null ? (
          <>
            <p className="font-heading text-lg leading-none font-semibold tracking-tight">
              {departureType === 'sold'
                ? formatCurrency(sneaker.salePrice)
                : t('history.tradeValue', { value: formatCurrency(sneaker.salePrice) })}
            </p>
            {gain != null ? (
              <p
                className={cn(
                  'mt-1 text-sm font-medium',
                  gain > 0 && 'text-gain',
                  gain < 0 && 'text-loss',
                  gain === 0 && 'text-muted-foreground',
                )}
              >
                {formatGainLoss(gain)}
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isRestoring}
        aria-label={t('history.restoreLabel', { name })}
        onClick={() => onRestore(sneaker)}
      >
        <ArchiveRestore aria-hidden />
        {isRestoring ? t('history.restoring') : t('history.restore')}
      </Button>
    </li>
  );
}
