import type { WishlistPriority } from '@kixvault/shared';
import { cn } from '@/lib/utils';
import { formatWishlistPriority, getWishlistPriorityDotClassName } from '@/lib/wishlist';

type WishlistPriorityBadgeProps = {
  priority: WishlistPriority;
  className?: string;
};

/** Priority pill: a dot that fills in as the grail gets more urgent, plus the label. */
export function WishlistPriorityBadge({ priority, className }: WishlistPriorityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn('size-2 rounded-full', getWishlistPriorityDotClassName(priority))}
      />
      {formatWishlistPriority(priority)}
    </span>
  );
}
