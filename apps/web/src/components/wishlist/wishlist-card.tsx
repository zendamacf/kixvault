import { Link } from '@tanstack/react-router';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { WishlistPriorityBadge } from '@/components/wishlist/wishlist-priority-badge';
import type { WishlistItem } from '@/lib/queries';

type WishlistCardProps = {
  item: WishlistItem;
};

/** Shoe tile for a grail, with its priority on the image and any notes underneath. */
export function WishlistCard({ item }: WishlistCardProps) {
  const title = `${item.brand} ${item.model}`;
  const subtitle = item.nickname ? `"${item.nickname}"` : item.colorway || 'No colorway';

  return (
    <Link
      to="/grails/$itemId/edit"
      params={{ itemId: item.id }}
      className="group block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative rounded-2xl bg-card ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-foreground/25">
        <SneakerThumbnail
          imageUrl={item.imageUrl}
          alt={title}
          className="aspect-[5/4] w-full rounded-none p-5"
        />
        <WishlistPriorityBadge priority={item.priority} className="absolute top-3 left-3" />
      </div>

      <div className="mt-3 space-y-1 px-1">
        <h2 className="line-clamp-2 font-heading text-base leading-snug font-semibold">
          <span className="font-normal text-muted-foreground">{item.brand}</span> {item.model}
        </h2>
        <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        {item.notes ? <p className="line-clamp-2 pt-1 text-sm">{item.notes}</p> : null}
      </div>
    </Link>
  );
}
