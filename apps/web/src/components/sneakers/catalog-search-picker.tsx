import type { CatalogMarketplace, CatalogSearchResult } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogSearchQueryOptions } from '@/lib/catalog';
import { useDebouncedValue } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { SneakerBrandBadge } from './sneaker-brand-badge';

const DEBOUNCE_DELAY = 1000;
const RESULTS_MAX_HEIGHT = 'max-h-[32rem]';

type CatalogSearchPickerProps = {
  query: string;
  onQueryChange: (query: string) => void;
  marketplace: CatalogMarketplace;
  onMarketplaceChange: (marketplace: CatalogMarketplace) => void;
  onSelect: (result: CatalogSearchResult) => void;
  selectedCatalogId?: string | null;
};

export function CatalogSearchPicker({
  query,
  onQueryChange,
  marketplace,
  onMarketplaceChange,
  onSelect,
  selectedCatalogId,
}: CatalogSearchPickerProps) {
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_DELAY);
  const canSearch = debouncedQuery.length >= 2;

  const { data, isLoading, isFetching, error } = useQuery({
    ...catalogSearchQueryOptions(debouncedQuery, marketplace),
    enabled: canSearch,
  });

  const results = data?.results ?? [];
  const unavailable = data?.unavailable ?? false;
  const marketplaceLabel = marketplace === 'stockx' ? 'StockX' : 'GOAT';

  return (
    <div className="min-w-0 space-y-3 rounded-lg border border-dashed p-4">
      <div className="space-y-2">
        <Label htmlFor="catalog-search">Find a sneaker</Label>
        <div className="flex gap-2">
          <Input
            id="catalog-search"
            className="min-w-0 flex-1"
            placeholder="Search by name or SKU (e.g. Air Jordan 1 Chicago, DZ5485-100)"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
          <Select
            value={marketplace}
            onValueChange={(value) => onMarketplaceChange(value as CatalogMarketplace)}
          >
            <SelectTrigger
              id="catalog-marketplace"
              aria-label="Marketplace"
              className="w-28 shrink-0"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stockx">StockX</SelectItem>
              <SelectItem value="goat">GOAT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Search {marketplaceLabel} to find your pair.
        </p>
      </div>

      {!canSearch && query.trim().length > 0 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : null}

      {unavailable ? (
        <p className="text-sm text-muted-foreground">
          Catalog search is unavailable. Switch to manual entry to add a pair.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      {canSearch && (isLoading || isFetching) ? (
        <div
          className={cn('grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2', RESULTS_MAX_HEIGHT)}
        >
          {(['one', 'two', 'three', 'four'] as const).map((key) => (
            <div key={key} className="flex min-w-0 items-center gap-4 rounded-md border p-3">
              <Skeleton className="h-24 w-24 shrink-0 rounded-md" />
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
          No sneakers found on {marketplaceLabel} for &ldquo;{debouncedQuery}&rdquo;.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul
          className={cn('grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2', RESULTS_MAX_HEIGHT)}
        >
          {results.map((result) => {
            const isSelected = selectedCatalogId === result.catalogId;

            return (
              <li key={`${result.catalogSource}:${result.catalogId}`} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(result)}
                  className={cn(
                    'flex w-full min-w-0 items-center gap-4 overflow-hidden rounded-md border p-3 text-left transition-colors hover:bg-accent/50',
                    isSelected && 'border-primary bg-accent/40',
                  )}
                >
                  <SneakerThumbnail
                    imageUrl={result.imageUrl}
                    alt={result.title}
                    className="h-24 w-24 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{result.title}</span>
                    <SneakerBrandBadge brand={result.brand} />
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
