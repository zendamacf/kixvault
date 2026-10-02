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

export function getWishlistPriorityBadgeClassName(priority: WishlistPriority): string {
  switch (priority) {
    case 'low':
      return 'border-border bg-muted text-muted-foreground';
    case 'high':
      return 'border-destructive/30 bg-destructive/10 text-destructive dark:bg-destructive/20';
    default:
      return 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300';
  }
}

export function formatGrailClearedMessage(clearedGrails: ClearedGrailSummary[]): string {
  if (clearedGrails.length === 1) {
    return `Congrats, you got your grail!`;
  }

  return `Congrats, you got ${clearedGrails.length} grails!`;
}
