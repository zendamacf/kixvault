import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ShoeSilhouette } from '@/components/layout/shoe-silhouette';
import { buttonVariants } from '@/components/ui/button';

/** Shown for any URL that does not match a route. */
export function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <ShoeSilhouette className="w-36 text-muted-foreground/40" />
      <div className="space-y-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {t('notFound.title')}
        </h1>
        <p className="max-w-md text-muted-foreground">{t('notFound.description')}</p>
      </div>
      <Link to="/" className={buttonVariants({ size: 'lg' })}>
        {t('common.backToCollection')}
      </Link>
    </div>
  );
}
