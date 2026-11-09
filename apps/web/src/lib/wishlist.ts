import type { WishlistPriority } from '@kixvault/shared';
import { toast } from 'sonner';

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

export function getWishlistPriorityDotClassName(priority: WishlistPriority): string {
  switch (priority) {
    case 'low':
      return 'border border-muted-foreground bg-transparent';
    case 'high':
      return 'bg-primary';
    default:
      return 'bg-muted-foreground';
  }
}

export function formatGrailClearedMessage(clearedGrails: ClearedGrailSummary[]): string {
  if (clearedGrails.length === 1) {
    return `Congrats, you got your grail!`;
  }

  return `Congrats, you got ${clearedGrails.length} grails!`;
}

export function showGrailClearedToast(clearedGrails: ClearedGrailSummary[]) {
  if (clearedGrails.length === 0) {
    return;
  }

  toast.message(formatGrailClearedMessage(clearedGrails), { icon: '🎉' });
}
