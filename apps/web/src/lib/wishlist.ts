import type { WishlistPriority } from '@kixvault/shared';

export function formatWishlistPriority(priority: WishlistPriority): string {
  switch (priority) {
    case 'low':
      return 'Low priority';
    case 'high':
      return 'High priority';
    default:
      return 'Medium priority';
  }
}
