import { Link } from '@tanstack/react-router';
import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
import { SneakerConditionBadge } from '@/components/sneakers/sneaker-condition-badge';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Sneaker } from '@/lib/queries';
import { formatCurrency, formatDate, formatGainLoss } from '@/lib/utils';

type SneakerCardProps = {
  sneaker: Sneaker;
};

/** Grid card linking to a sneaker's detail page. */
export function SneakerCard({ sneaker }: SneakerCardProps) {
  const title = `${sneaker.brand} ${sneaker.model}`;
  const subtitle = sneaker.nickname ? `"${sneaker.nickname}"` : sneaker.colorway || 'No colorway';

  return (
    <Link to="/sneakers/$sneakerId" params={{ sneakerId: sneaker.id }} className="block h-full">
      <Card className="h-full overflow-hidden transition-colors hover:border-primary/40 hover:bg-accent/30">
        <SneakerThumbnail
          imageUrl={sneaker.primaryImage?.url ?? null}
          alt={title}
          className="aspect-square w-full rounded-none p-2"
        />
        <CardHeader className="pt-2 pb-2 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <SneakerBrandBadge brand={sneaker.brand} />
            <SneakerConditionBadge condition={sneaker.condition} />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base">{title}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {subtitle} · Size {sneaker.size}
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <p>Paid {formatCurrency(sneaker.purchasePrice)}</p>
            {sneaker.purchaseDate ? <p>{formatDate(sneaker.purchaseDate)}</p> : null}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p>
              Value{' '}
              <span className="font-medium text-foreground">
                {formatCurrency(sneaker.currentMarketPrice)}
              </span>
            </p>
            {sneaker.gainLoss != null ? (
              <p
                className={
                  sneaker.gainLoss > 0
                    ? 'font-medium text-emerald-600 dark:text-emerald-400'
                    : sneaker.gainLoss < 0
                      ? 'font-medium text-destructive'
                      : undefined
                }
              >
                {formatGainLoss(sneaker.gainLoss)}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
