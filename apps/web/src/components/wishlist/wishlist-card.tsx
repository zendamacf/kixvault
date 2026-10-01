import { Link } from '@tanstack/react-router';
import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WishlistItem } from '@/lib/queries';
import { formatWishlistPriority } from '@/lib/wishlist';

type WishlistCardProps = {
  item: WishlistItem;
};

/** Grid card for a grail / wishlist entry. */
export function WishlistCard({ item }: WishlistCardProps) {
  const title = `${item.brand} ${item.model}`;
  const subtitle = item.nickname ? `"${item.nickname}"` : item.colorway || 'No colorway';

  return (
    <Link to="/grails/$itemId/edit" params={{ itemId: item.id }} className="block h-full">
      <Card className="h-full overflow-hidden transition-colors hover:border-primary/40 hover:bg-accent/30">
        <SneakerThumbnail
          imageUrl={item.imageUrl}
          alt={title}
          className="aspect-square w-full rounded-none p-2"
        />
        <CardHeader className="space-y-2 pt-2 pb-2">
          <div className="flex items-start justify-between gap-2">
            <SneakerBrandBadge brand={item.brand} />
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {formatWishlistPriority(item.priority)}
            </span>
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base">{title}</CardTitle>
            <p className="truncate text-sm text-muted-foreground">
              {subtitle}
              {item.targetSize != null ? ` · Target size ${item.targetSize}` : ''}
            </p>
          </div>
        </CardHeader>
        {item.notes ? (
          <CardContent className="pt-0 text-sm text-muted-foreground line-clamp-2">
            {item.notes}
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}
