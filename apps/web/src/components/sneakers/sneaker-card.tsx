import { Link } from '@tanstack/react-router';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import type { Sneaker } from '@/lib/queries';
import { cn, formatCondition, formatCurrency, formatGainLoss } from '@/lib/utils';

type SneakerCardProps = {
  sneaker: Sneaker;
};

/** Shoe tile with a caption underneath, linking to the sneaker's detail page. */
export function SneakerCard({ sneaker }: SneakerCardProps) {
  const title = `${sneaker.brand} ${sneaker.model}`;
  const subtitle = sneaker.nickname ? `"${sneaker.nickname}"` : sneaker.colorway || 'No colorway';
  const hasMarketPrice = sneaker.currentMarketPrice != null;

  return (
    <Link
      to="/sneakers/$sneakerId"
      params={{ sneakerId: sneaker.id }}
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative rounded-2xl bg-card ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-foreground/25">
        <SneakerThumbnail
          imageUrl={sneaker.primaryImage?.url ?? null}
          alt={title}
          className="aspect-[5/4] w-full rounded-none p-5"
        />
        <span className="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {formatCondition(sneaker.condition)}
        </span>
      </div>

      <div className="mt-3 space-y-1 px-1">
        <h2 className="line-clamp-2 font-heading text-base leading-snug font-semibold">
          <span className="font-normal text-muted-foreground">{sneaker.brand}</span> {sneaker.model}
        </h2>
        <div className="flex items-baseline justify-between gap-3 text-sm text-muted-foreground">
          <p className="min-w-0 truncate">{subtitle}</p>
          <p className="shrink-0 whitespace-nowrap">Size {sneaker.size}</p>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 pt-1.5">
          {hasMarketPrice ? (
            <p className="flex items-baseline gap-2">
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
          ) : null}
          <p
            className={cn(
              'text-sm whitespace-nowrap text-muted-foreground',
              !hasMarketPrice && 'font-medium',
            )}
          >
            Paid {formatCurrency(sneaker.purchasePrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
