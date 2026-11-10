import { type SneakerCondition, sneakerConditions } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  'created_at:desc',
  'created_at:asc',
  'purchase_date:desc',
  'purchase_date:asc',
  'purchase_price:desc',
  'purchase_price:asc',
  'brand:asc',
  'brand:desc',
] as const;

type SneakerConditionFilter = SneakerCondition | '';

export const Route = createFileRoute('/_authenticated/')({
  component: CollectionPage,
});

function CollectionPage() {
  const { t } = useTranslation();
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
    { value: '', label: t('collection.allConditions') },
    ...sneakerConditions.map((value) => ({ value, label: formatCondition(value) })),
  ];

  return (
    <div className="space-y-10">
      <h1 className="sr-only">{t('collection.pageTitle')}</h1>

      <CollectionSummary
        count={statsData?.stats.count}
        totalSpend={statsData?.stats.totalSpend}
        avgSpend={statsData?.stats.avgSpend}
        totalMarketValue={statsData?.stats.totalMarketValue}
        totalGainLoss={statsData?.stats.totalGainLoss}
        isLoading={statsLoading}
      />

      <section className="space-y-6" aria-label={t('collection.pairsLabel')}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative lg:w-80">
            <Label htmlFor="search-filter" className="sr-only">
              {t('collection.searchLabel')}
            </Label>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="search-filter"
              type="search"
              className="pl-9"
              placeholder={t('collection.searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <fieldset className="-mx-4 flex min-w-0 gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
            <legend className="sr-only">{t('collection.conditionLegend')}</legend>
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
                      : 'border-input bg-card text-foreground hover:bg-muted',
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
                {t('collection.reset')}
              </Button>
            ) : null}
            <Label htmlFor="sort-filter" className="sr-only">
              {t('collection.sortLabel')}
            </Label>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger id="sort-filter" className="w-full lg:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`collection.sort.${option.replace(':', '_')}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {isLoading ? '' : t('collection.pairCount', { count: sneakers.length })}
        </p>

        {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

        {isLoading ? <SneakerGridSkeleton /> : null}

        {!isLoading && sneakers.length === 0 && totalCount === 0 ? (
          <EmptyState
            title={t('collection.empty.title')}
            description={t('collection.empty.description')}
            actionLabel={t('collection.empty.action')}
            actionTo="/sneakers/new"
          />
        ) : null}

        {!isLoading && sneakers.length === 0 && totalCount > 0 ? (
          <EmptyState
            title={t('collection.noMatches.title')}
            description={t('collection.noMatches.description')}
            onClearFilters={clearFilters}
          />
        ) : null}

        {!isLoading && sneakers.length > 0 ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {sneakers.map((sneaker) => (
              <li key={sneaker.id}>
                <SneakerCard sneaker={sneaker} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
