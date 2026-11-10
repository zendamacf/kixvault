import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ShoeSilhouette } from '@/components/layout/shoe-silhouette';
import { Button, buttonVariants } from '@/components/ui/button';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onClearFilters?: () => void;
};

/** Message and action when the collection is empty or filtered to zero results. */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onClearFilters,
}: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-card px-6 py-14 text-center ring-1 ring-border">
      <ShoeSilhouette className="w-40 text-muted-foreground/40" />
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mx-auto max-w-md text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionLabel && actionTo ? (
          <Link to={actionTo} className={buttonVariants({ size: 'lg' })}>
            {actionLabel}
          </Link>
        ) : null}
        {onClearFilters ? (
          <Button type="button" size="lg" variant="outline" onClick={onClearFilters}>
            {t('collection.resetFilters')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
