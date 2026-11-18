import { type SneakerCondition, sneakerConditions } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { LayoutGrid, List, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CollectionSummary } from '@/components/collection/collection-summary';
import { EmptyState } from '@/components/collection/empty-state';
import { SneakerGridSkeleton } from '@/components/collection/sneaker-grid-skeleton';
import { SneakerTable, SneakerTableSkeleton } from '@/components/collection/sneaker-table';
import { SneakerCard } from '@/components/sneakers/sneaker-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SegmentedControl } from '@/components/ui/segmented-control';
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

const DEFAULT_SORT = 'created_at:desc';

const SORT_OPTIONS = [
  'created_at:desc',
  'created_at:asc',
  'purchase_price:desc',
  'purchase_price:asc',
  'brand:asc',
  'brand:desc',
  'wear_count:desc',
  'wear_count:asc',
] as const;

/** Select items cannot have an empty value, so "no filter" gets a sentinel. */
const ALL_CONDITIONS = 'all';

const VIEW_STORAGE_KEY = 'kixvault:collection-view';

type CollectionView = 'grid' | 'list';

function readStoredView(): CollectionView {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

type SneakerConditionFilter = SneakerCondition | '';

export const Route = createFileRoute('/_authenticated/')({
  component: CollectionPage,
});

function CollectionPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [condition, setCondition] = useState<SneakerConditionFilter>('');
  const [sortKey, setSortKey] = useState<string>(DEFAULT_SORT);
  const [view, setView] = useState<CollectionView>(readStoredView);

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

  function changeView(next: CollectionView) {
    setView(next);

    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable. The view then resets to the grid on the next visit.
    }
  }

  function clearFilters() {
    setSearch('');
    setCondition('');
    setSortKey(DEFAULT_SORT);
  }

  const conditionOptions: { value: string; label: string }[] = [
    { value: ALL_CONDITIONS, label: t('collection.allConditions') },
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

          <div className="lg:w-48">
            <Label htmlFor="condition-filter" className="sr-only">
              {t('collection.conditionLegend')}
            </Label>
            <Select
              value={condition || ALL_CONDITIONS}
              onValueChange={(value) =>
                setCondition(value === ALL_CONDITIONS ? '' : (value as SneakerCondition))
              }
            >
              <SelectTrigger id="condition-filter" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {conditionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            {hasCustomView ? (
              <Button type="button" variant="ghost" onClick={clearFilters}>
                {t('collection.reset')}
              </Button>
            ) : null}
            <SegmentedControl
              label={t('collection.view.label')}
              value={view}
              onChange={changeView}
              className="w-auto"
              options={[
                {
                  value: 'grid',
                  label: t('collection.view.grid'),
                  icon: <LayoutGrid className="size-4" aria-hidden />,
                },
                {
                  value: 'list',
                  label: t('collection.view.list'),
                  icon: <List className="size-4" aria-hidden />,
                },
              ]}
            />
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

        {isLoading && view === 'grid' ? <SneakerGridSkeleton /> : null}
        {isLoading && view === 'list' ? <SneakerTableSkeleton /> : null}

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

        {!isLoading && sneakers.length > 0 && view === 'list' ? (
          <SneakerTable sneakers={sneakers} sortField={sortKey.split(':')[0]} />
        ) : null}

        {!isLoading && sneakers.length > 0 && view === 'grid' ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {sneakers.map((sneaker) => (
              <li key={sneaker.id}>
                <SneakerCard sneaker={sneaker} sortField={sortKey.split(':')[0]} />
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
