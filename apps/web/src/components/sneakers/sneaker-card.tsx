import { Link } from '@tanstack/react-router';
import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Sneaker } from '@/lib/queries';
import { formatCondition, formatCurrency, formatDate } from '@/lib/utils';

type SneakerCardProps = {
  sneaker: Sneaker;
};

export function SneakerCard({ sneaker }: SneakerCardProps) {
  const title = `${sneaker.brand} ${sneaker.model}`;
  const subtitle = sneaker.nickname ? `"${sneaker.nickname}"` : sneaker.colorway || 'No colorway';

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
        <CardContent className="flex items-center justify-between pt-0 text-sm text-muted-foreground">
          <p>Paid {formatCurrency(sneaker.purchasePrice)}</p>
          {sneaker.purchaseDate ? <p>{formatDate(sneaker.purchaseDate)}</p> : null}
        </CardContent>
      </Card>
    </Link>
  );
}
