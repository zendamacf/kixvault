import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/collection/empty-state';
import { SneakerGridSkeleton } from '@/components/collection/sneaker-grid-skeleton';
import { buttonVariants } from '@/components/ui/button';
import { WishlistCard } from '@/components/wishlist/wishlist-card';
import { wishlistQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/grails/')({
  component: GrailsPage,
});

function GrailsPage() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery(wishlistQueryOptions);
  const items = data?.items ?? [];
  const highCount = items.filter((item) => item.priority === 'high').length;
  const hasItems = !isLoading && !error && items.length > 0;

  return (
    <div className="space-y-10">
      <h1 className="sr-only">{t('grails.pageTitle')}</h1>

      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        {hasItems ? (
          <p className="max-w-3xl text-balance font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
            <Trans
              i18nKey={highCount > 0 ? 'grails.summaryHigh' : 'grails.summary'}
              count={items.length}
              values={{ high: highCount }}
              components={{ strong: <strong className="font-semibold text-foreground" /> }}
            />
          </p>
        ) : (
          <p className="max-w-xl text-balance font-heading text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
            {t('grails.tagline')}
          </p>
        )}

        {hasItems ? (
          <Link to="/grails/new" className={buttonVariants({ size: 'lg' })}>
            <Plus aria-hidden />
            {t('grails.add')}
          </Link>
        ) : null}
      </div>

      {isLoading ? <SneakerGridSkeleton /> : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {t('grails.loadFailed')}
        </p>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          title={t('grails.empty.title')}
          description={t('grails.empty.description')}
          actionLabel={t('grails.empty.action')}
          actionTo="/grails/new"
        />
      ) : null}

      {hasItems ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <WishlistCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
