import { sneakerConditions } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/collection/empty-state';
import { SneakerGridSkeleton } from '@/components/collection/sneaker-grid-skeleton';
import { StatsCards } from '@/components/collection/stats-cards';
import { SneakerCard } from '@/components/sneakers/sneaker-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/lib/hooks';
import { type Sneaker, sneakersQueryOptions, statsQueryOptions } from '@/lib/queries';
import { formatCondition } from '@/lib/utils';

const DEBOUNCE_DELAY = 300;

export const Route = createFileRoute('/_authenticated/')({
  component: CollectionPage,
});

function CollectionPage() {
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const debouncedSearch = useDebouncedValue(search.trim(), DEBOUNCE_DELAY);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      condition: condition || undefined,
      sort,
      order,
    }),
    [debouncedSearch, condition, sort, order],
  );

  const hasActiveFilters = Boolean(debouncedSearch || condition);

  const {
    data: sneakersData,
    isLoading,
    isFetching,
    error,
  } = useQuery(sneakersQueryOptions(filters));
  const { data: statsData, isLoading: statsLoading } = useQuery(statsQueryOptions);

  const sneakers = (sneakersData?.sneakers ?? []) as Sneaker[];
  const totalCount = statsData?.stats.count ?? 0;

  function clearFilters() {
    setSearch('');
    setCondition('');
    setSort('created_at');
    setOrder('desc');
  }

  return (
    <div className="space-y-8">
      <StatsCards
        count={statsData?.stats.count}
        totalSpend={statsData?.stats.totalSpend}
        avgSpend={statsData?.stats.avgSpend}
        isLoading={statsLoading}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your collection</h1>
            <p className="text-sm text-muted-foreground">
              Search, filter, and manage every pair you own.
            </p>
          </div>
          <Link
            to="/sneakers/new"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            Add pair
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">Filters</p>
            {hasActiveFilters ? (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search-filter">Search</Label>
              <Input
                id="search-filter"
                placeholder="Search brand, model, colorway, SKU, or notes"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition-filter">Condition</Label>
              <Select
                value={condition || 'all'}
                onValueChange={(value) => setCondition(value === 'all' ? '' : value)}
              >
                <SelectTrigger id="condition-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conditions</SelectItem>
                  {sneakerConditions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {formatCondition(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort-filter">Sort by</Label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger id="sort-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date added</SelectItem>
                  <SelectItem value="purchase_date">Purchase date</SelectItem>
                  <SelectItem value="purchase_price">Purchase price</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-filter">Order</Label>
              <Select value={order} onValueChange={setOrder}>
                <SelectTrigger id="order-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>
            {isLoading || isFetching
              ? 'Updating results...'
              : `${sneakers.length} ${sneakers.length === 1 ? 'pair' : 'pairs'} shown`}
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

        {isLoading ? <SneakerGridSkeleton /> : null}

        {!isLoading && sneakers.length === 0 && totalCount === 0 ? (
          <EmptyState
            title="Your vault is empty"
            description="Add your first pair to start tracking brands, sizes, and spend."
            actionLabel="Add your first pair"
            actionTo="/sneakers/new"
          />
        ) : null}

        {!isLoading && sneakers.length === 0 && totalCount > 0 ? (
          <EmptyState
            title="No matches found"
            description="Try a different brand or condition, or clear your filters."
            onClearFilters={clearFilters}
          />
        ) : null}

        {!isLoading && sneakers.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sneakers.map((sneaker) => (
              <SneakerCard key={sneaker.id} sneaker={sneaker} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
