import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { EmptyState } from '@/components/collection/empty-state';
import { Button } from '@/components/ui/button';
import { WishlistCard } from '@/components/wishlist/wishlist-card';
import { wishlistQueryOptions } from '@/lib/queries';

export const Route = createFileRoute('/_authenticated/grails/')({
  component: GrailsPage,
});

function GrailsPage() {
  const { data, isLoading, error } = useQuery(wishlistQueryOptions);
  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Grails</h1>
          <p className="text-sm text-muted-foreground">
            Sneakers you want but do not own yet — separate from your vault.
          </p>
        </div>
        <Link to="/grails/new">
          <Button>Add grail</Button>
        </Link>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading grails…</p> : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load your grails. Try again in a moment.
        </p>
      ) : null}

      {!isLoading && !error && items.length === 0 ? (
        <EmptyState
          title="No grails yet"
          description="Save pairs you are hunting for — from StockX search or a quick manual entry."
          actionLabel="Add your first grail"
          actionTo="/grails/new"
        />
      ) : null}

      {!isLoading && !error && items.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
