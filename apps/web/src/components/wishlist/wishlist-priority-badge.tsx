import type { WishlistPriority } from '@kixvault/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatWishlistPriority, getWishlistPriorityBadgeClassName } from '@/lib/wishlist';

type WishlistPriorityBadgeProps = {
  priority: WishlistPriority;
  className?: string;
};

/** Priority label with colors that reflect low, medium, and high grails. */
export function WishlistPriorityBadge({ priority, className }: WishlistPriorityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('shrink-0', getWishlistPriorityBadgeClassName(priority), className)}
    >
      {formatWishlistPriority(priority)}
    </Badge>
  );
}
