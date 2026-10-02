import type { WishlistPriority } from '@kixvault/shared';

export type ClearedGrailSummary = {
  brand: string;
  model: string;
};

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

export function formatGrailClearedMessage(clearedGrails: ClearedGrailSummary[]): string {
  if (clearedGrails.length === 1) {
    return `Congrats, you got your grail!`;
  }

  return `Congrats, you got ${clearedGrails.length} grails!`;
}
