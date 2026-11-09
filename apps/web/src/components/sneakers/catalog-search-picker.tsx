import type { CatalogSearchResult } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogSearchQueryOptions } from '@/lib/catalog';
import { useDebouncedValue } from '@/lib/hooks';
import { cn } from '@/lib/utils';

const DEBOUNCE_DELAY = 2000;
const RESULTS_MAX_HEIGHT = 'max-h-[32rem]';
const RESULT_THUMBNAIL_CLASS = 'h-24 w-28 shrink-0';

type CatalogSearchPickerProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (result: CatalogSearchResult) => void;
  selectedCatalogId?: string | null;
};

/** StockX catalog search input and result list. */
export function CatalogSearchPicker({
  query,
  onQueryChange,
  onSelect,
  selectedCatalogId,
}: CatalogSearchPickerProps) {
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_DELAY);
  const canSearch = debouncedQuery.length >= 3;

  const { data, isLoading, isFetching, error } = useQuery({
    ...catalogSearchQueryOptions(debouncedQuery),
    enabled: canSearch,
  });

  const results = data?.results ?? [];
  const unavailable = data?.unavailable ?? false;

  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="catalog-search">Find a sneaker</Label>
        <Input
          id="catalog-search"
          placeholder="Search by name or SKU"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <p className="text-sm text-muted-foreground">
          Searches StockX. Try "Air Jordan 1 Chicago" or "DZ5485-100".
        </p>
      </div>

      {!canSearch && query.trim().length > 0 ? (
        <p className="text-sm text-muted-foreground">Type at least 3 characters to search.</p>
      ) : null}

      {unavailable ? (
        <p className="text-sm text-muted-foreground">
          Catalog search is unavailable. Switch to manual entry to add a pair.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      {canSearch && (isLoading || isFetching) ? (
        <div
          className={cn(
            'grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2',
            RESULTS_MAX_HEIGHT,
          )}
        >
          {(['one', 'two', 'three', 'four'] as const).map((key) => (
            <div
              key={key}
              className="flex min-w-0 items-center gap-4 rounded-2xl bg-tile p-3 ring-1 ring-border"
            >
              <Skeleton className={cn(RESULT_THUMBNAIL_CLASS, 'rounded-md')} />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {canSearch && !isLoading && !isFetching && !error && !unavailable && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sneakers found on StockX for &ldquo;{debouncedQuery}&rdquo;.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul
          className={cn(
            'grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2',
            RESULTS_MAX_HEIGHT,
          )}
        >
          {results.map((result) => {
            const isSelected = selectedCatalogId === result.catalogId;

            return (
              <li key={`${result.catalogSource}:${result.catalogId}`} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(result)}
                  className={cn(
                    'flex w-full min-w-0 items-center gap-4 overflow-hidden rounded-2xl bg-tile p-3 text-left ring-1 ring-border transition-shadow outline-none hover:ring-2 hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected && 'ring-2 ring-foreground',
                  )}
                >
                  <SneakerThumbnail
                    imageUrl={result.imageUrl}
                    alt={result.title}
                    className={RESULT_THUMBNAIL_CLASS}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-heading font-semibold">
                      {result.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {result.brand}
                    </span>
                    {result.nickname ? (
                      <span className="block truncate text-sm text-foreground">
                        {`"${result.nickname}"`}
                      </span>
                    ) : null}
                    {result.colorway ? (
                      <span className="block truncate text-sm text-muted-foreground">
                        {result.colorway}
                      </span>
                    ) : null}
                    <span className="block truncate text-sm text-muted-foreground">
                      {result.sku}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
