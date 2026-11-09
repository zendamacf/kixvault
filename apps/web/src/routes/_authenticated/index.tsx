import { type SneakerCondition, sneakerConditions } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CollectionSummary } from '@/components/collection/collection-summary';
import { EmptyState } from '@/components/collection/empty-state';
import { SneakerGridSkeleton } from '@/components/collection/sneaker-grid-skeleton';
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
import { cn, formatCondition } from '@/lib/utils';

const DEBOUNCE_DELAY = 300;

const DEFAULT_SORT = 'created_at:desc';

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Recently added' },
  { value: 'created_at:asc', label: 'Oldest added' },
  { value: 'purchase_date:desc', label: 'Newest purchase' },
  { value: 'purchase_date:asc', label: 'Oldest purchase' },
  { value: 'purchase_price:desc', label: 'Price paid, high to low' },
  { value: 'purchase_price:asc', label: 'Price paid, low to high' },
  { value: 'brand:asc', label: 'Brand, A to Z' },
  { value: 'brand:desc', label: 'Brand, Z to A' },
] as const;

type SneakerConditionFilter = SneakerCondition | '';

export const Route = createFileRoute('/_authenticated/')({
  component: CollectionPage,
});

function CollectionPage() {
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState<SneakerConditionFilter>('');
  const [sortKey, setSortKey] = useState<string>(DEFAULT_SORT);

  const debouncedSearch = useDebouncedValue(search.trim(), DEBOUNCE_DELAY);

  const filters = useMemo(() => {
    const [sort, order] = sortKey.split(':');

    return {
      search: debouncedSearch || undefined,
      condition: condition || undefined,
      sort,
      order,
    };
  }, [debouncedSearch, condition, sortKey]);

  const hasActiveFilters = Boolean(debouncedSearch || condition);
  const hasCustomView = hasActiveFilters || sortKey !== DEFAULT_SORT;

  const { data: sneakersData, isLoading, error } = useQuery(sneakersQueryOptions(filters));
  const { data: statsData, isLoading: statsLoading } = useQuery(statsQueryOptions);

  const sneakers = (sneakersData?.sneakers ?? []) as Sneaker[];
  const totalCount = statsData?.stats.count ?? 0;

  function clearFilters() {
    setSearch('');
    setCondition('');
    setSortKey(DEFAULT_SORT);
  }

  const conditionChips: { value: SneakerConditionFilter; label: string }[] = [
    { value: '', label: 'All' },
    ...sneakerConditions.map((value) => ({ value, label: formatCondition(value) })),
  ];

  return (
    <div className="space-y-10">
      <h1 className="sr-only">Your collection</h1>

      <CollectionSummary
        count={statsData?.stats.count}
        totalSpend={statsData?.stats.totalSpend}
        avgSpend={statsData?.stats.avgSpend}
        totalMarketValue={statsData?.stats.totalMarketValue}
        totalGainLoss={statsData?.stats.totalGainLoss}
        isLoading={statsLoading}
      />

      <section className="space-y-6" aria-label="Pairs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-80">
            <Label htmlFor="search-filter" className="sr-only">
              Search your collection
            </Label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="search-filter"
              type="search"
              className="pl-9"
              placeholder="Search brand, model, colorway, SKU"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <fieldset className="-mx-4 flex min-w-0 gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
            <legend className="sr-only">Condition</legend>
            {conditionChips.map((chip) => {
              const active = condition === chip.value;

              return (
                <button
                  key={chip.value || 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCondition(chip.value)}
                  className={cn(
                    'h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                    active
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-input bg-tile text-foreground hover:bg-muted',
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </fieldset>

          <div className="flex items-center gap-2 lg:ml-auto">
            {hasCustomView ? (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                Reset
              </Button>
            ) : null}
            <Label htmlFor="sort-filter" className="sr-only">
              Sort pairs
            </Label>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger id="sort-filter" className="w-full lg:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? '' : `${sneakers.length} ${sneakers.length === 1 ? 'pair' : 'pairs'}`}
        </p>

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
            description="Try a different brand or condition, or reset the filters."
            onClearFilters={clearFilters}
          />
        ) : null}

        {!isLoading && sneakers.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {sneakers.map((sneaker) => (
              <SneakerCard key={sneaker.id} sneaker={sneaker} />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
