import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { EmptyState } from '@/components/collection/empty-state';
import { SneakerGridSkeleton } from '@/components/collection/sneaker-grid-skeleton';
import { buttonVariants } from '@/components/ui/button';
import { WishlistCard } from '@/components/wishlist/wishlist-card';
import { wishlistQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/grails/')({
  component: GrailsPage,
});

function GrailsPage() {
  const { data, isLoading, error } = useQuery(wishlistQueryOptions);
  const items = data?.items ?? [];
  const highCount = items.filter((item) => item.priority === 'high').length;
  const hasItems = !isLoading && !error && items.length > 0;

  return (
    <div className="space-y-10">
      <h1 className="sr-only">Grails</h1>

      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
        {hasItems ? (
          <p className="max-w-3xl text-balance font-display text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
            <strong className="font-semibold text-foreground">{items.length}</strong>{' '}
            {items.length === 1 ? 'grail' : 'grails'} on the hunt
            {highCount > 0 ? (
              <>
                , <strong className="font-semibold text-foreground">{highCount}</strong> at high
                priority.
              </>
            ) : (
              '.'
            )}
          </p>
        ) : (
          <p className="max-w-xl text-balance font-display text-3xl leading-[1.15] tracking-tight text-muted-foreground sm:text-4xl">
            Pairs you want but don't own yet.
          </p>
        )}

        {hasItems ? (
          <Link to="/grails/new" className={buttonVariants({ size: 'lg' })}>
            <Plus aria-hidden />
            Add grail
          </Link>
        ) : null}
      </div>

      {isLoading ? <SneakerGridSkeleton /> : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load your grails. Try again in a moment.
        </p>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          title="No grails yet"
          description="Save pairs you are hunting for from StockX search or a quick manual entry."
          actionLabel="Add your first grail"
          actionTo="/grails/new"
        />
      ) : null}

      {hasItems ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
