import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import type { Sneaker } from '@/lib/queries';
import { cn, formatCurrency, formatDate, formatGainLoss } from '@/lib/utils';

type SneakerCardProps = {
  sneaker: Sneaker;
  /** The active collection sort field; its value is surfaced on the card. */
  sortField?: string;
};

/** Shoe tile with a caption underneath, linking to the sneaker's detail page. */
export function SneakerCard({ sneaker, sortField }: SneakerCardProps) {
  const { t } = useTranslation();
  const title = `${sneaker.brand} ${sneaker.model}`;
  const subtitle = sneaker.nickname
    ? `"${sneaker.nickname}"`
    : sneaker.colorway || t('common.noColorway');
  const hasMarketPrice = sneaker.currentMarketPrice != null;
  const paid = t('sneakerCard.paid', { value: formatCurrency(sneaker.purchasePrice) });
  // One secondary detail on the right: the value the list is sorted by, else the wear count.
  // Without a market price "Paid" already fills the left side, so it is not repeated.
  const extra =
    sortField === 'created_at'
      ? t('sneakerCard.added', { date: formatDate(sneaker.createdAt) })
      : sortField === 'purchase_price'
        ? hasMarketPrice
          ? paid
          : null
        : sneaker.wearCount > 0 || sortField === 'wear_count'
          ? t('common.wearCount', { count: sneaker.wearCount })
          : null;

  return (
    <Link
      to="/sneakers/$sneakerId"
      params={{ sneakerId: sneaker.id }}
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="rounded-2xl bg-card ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-foreground/25">
        <SneakerThumbnail
          imageUrl={sneaker.primaryImage?.url ?? null}
          alt={title}
          className="aspect-[5/4] w-full rounded-none p-5"
        />
      </div>

      <div className="mt-3 space-y-0.5 px-1">
        <h2 className="truncate font-heading text-base leading-snug font-semibold">
          <span className="font-normal text-muted-foreground">{sneaker.brand}</span> {sneaker.model}
        </h2>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pt-2">
          {hasMarketPrice ? (
            <p className="flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-heading text-xl leading-none font-semibold tracking-tight">
                {formatCurrency(sneaker.currentMarketPrice)}
              </span>
              {sneaker.gainLoss != null ? (
                <span
                  className={cn(
                    'text-sm font-medium',
                    sneaker.gainLoss > 0 && 'text-gain',
                    sneaker.gainLoss < 0 && 'text-loss',
                    sneaker.gainLoss === 0 && 'text-muted-foreground',
                  )}
                >
                  {formatGainLoss(sneaker.gainLoss)}
                </span>
              ) : null}
            </p>
          ) : (
            <p className="text-sm font-medium whitespace-nowrap">{paid}</p>
          )}
          {extra ? <p className="min-w-0 truncate text-sm font-medium">{extra}</p> : null}
        </div>
      </div>
    </Link>
  );
}
