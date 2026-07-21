import { Link } from '@tanstack/react-router';
import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isMarketValueApplicable } from '@/lib/pricing';
import type { Sneaker } from '@/lib/queries';
import { formatCondition, formatCurrency, formatDate, formatGainLoss } from '@/lib/utils';

type SneakerCardProps = {
  sneaker: Sneaker;
};

/** Grid card linking to a sneaker's detail page. */
export function SneakerCard({ sneaker }: SneakerCardProps) {
  const title = `${sneaker.brand} ${sneaker.model}`;
  const subtitle = sneaker.nickname ? `"${sneaker.nickname}"` : sneaker.colorway || 'No colorway';
  const showMarketValue =
    isMarketValueApplicable(sneaker.condition) && sneaker.currentMarketPrice != null;

  return (
    <Link to="/sneakers/$sneakerId" params={{ sneakerId: sneaker.id }} className="block h-full">
      <Card className="h-full overflow-hidden transition-colors hover:border-primary/40 hover:bg-accent/30">
        <SneakerThumbnail
          imageUrl={sneaker.imageUrl}
          alt={title}
          className="w-full rounded-none p-2"
        />
        <CardHeader className="pt-2 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-2">
              <SneakerBrandBadge brand={sneaker.brand} />
              <CardTitle className="truncate text-base">{title}</CardTitle>
              <p className="truncate text-sm text-muted-foreground">
                {subtitle} · Size {sneaker.size}
              </p>
            </div>
            <Badge className="shrink-0">{formatCondition(sneaker.condition)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <p>Paid {formatCurrency(sneaker.purchasePrice)}</p>
            {sneaker.purchaseDate ? <p>{formatDate(sneaker.purchaseDate)}</p> : null}
          </div>
          {showMarketValue ? (
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
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}
