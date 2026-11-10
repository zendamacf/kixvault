import type { WishlistPriority } from '@kixvault/shared';
import { toast } from 'sonner';
import { i18n } from '@/i18n';

export type ClearedGrailSummary = {
  brand: string;
  model: string;
};

export function formatWishlistPriority(priority: WishlistPriority): string {
  switch (priority) {
    case 'low':
    case 'high':
      return i18n.t(`priority.${priority}`);
    default:
      return i18n.t('priority.medium');
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
  return i18n.t('grails.cleared', { count: clearedGrails.length });
}

export function showGrailClearedToast(clearedGrails: ClearedGrailSummary[]) {
  if (clearedGrails.length === 0) {
    return;
  }

  toast.message(formatGrailClearedMessage(clearedGrails), { icon: '🎉' });
}
