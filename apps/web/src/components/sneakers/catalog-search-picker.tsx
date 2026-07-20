import type { CatalogMarketplace, CatalogSearchResult } from '@kixvault/shared';
import { isValidBarcode, normalizeBarcode } from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BarcodeScanButton } from '@/components/sneakers/barcode-scanner';
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
const RESULT_THUMBNAIL_CLASS = 'h-32 w-32 shrink-0';

type CatalogSearchPickerProps = {
  query: string;
  onQueryChange: (query: string) => void;
  marketplace: CatalogMarketplace;
  onMarketplaceChange: (marketplace: CatalogMarketplace) => void;
  onSelect: (result: CatalogSearchResult) => void;
  selectedCatalogId?: string | null;
};

/** GOAT/StockX catalog search input, marketplace selector, and result list. */
export function CatalogSearchPicker({
  query,
  onQueryChange,
  marketplace,
  onMarketplaceChange,
  onSelect,
  selectedCatalogId,
}: CatalogSearchPickerProps) {
  const [scanSearchQuery, setScanSearchQuery] = useState<string | null>(null);
  const [autoSelectOnSingleResult, setAutoSelectOnSingleResult] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_DELAY);
  const searchQuery = scanSearchQuery ?? debouncedQuery;
  const canSearch = searchQuery.length >= 2;
  const marketplaceLabel = marketplace === 'stockx' ? 'StockX' : 'GOAT';

  const { data, isLoading, isFetching, error } = useQuery({
    ...catalogSearchQueryOptions(searchQuery, marketplace),
    enabled: canSearch,
  });

  const results = data?.results ?? [];
  const unavailable = data?.unavailable ?? false;

  useEffect(() => {
    if (scanSearchQuery && debouncedQuery === scanSearchQuery) {
      setScanSearchQuery(null);
    }
  }, [debouncedQuery, scanSearchQuery]);

  useEffect(() => {
    if (!autoSelectOnSingleResult || isLoading || isFetching || error || unavailable) {
      return;
    }

    if (results.length === 1) {
      onSelect(results[0]);
      setAutoSelectOnSingleResult(false);
    }
  }, [autoSelectOnSingleResult, isLoading, isFetching, error, unavailable, results, onSelect]);

  const handleBarcodeScan = (rawValue: string) => {
    setScanError(null);

    if (!isValidBarcode(rawValue)) {
      setScanError('That barcode is not a valid UPC or EAN. Try scanning again or type the SKU.');
      return;
    }

    const normalized = normalizeBarcode(rawValue);

    if (!normalized) {
      setScanError('That barcode is not a valid UPC or EAN. Try scanning again or type the SKU.');
      return;
    }

    onQueryChange(normalized);
    setScanSearchQuery(normalized);
    setAutoSelectOnSingleResult(true);
  };

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
            onChange={(event) => {
              setScanSearchQuery(null);
              setAutoSelectOnSingleResult(false);
              setScanError(null);
              onQueryChange(event.target.value);
            }}
          />
          <BarcodeScanButton onScan={handleBarcodeScan} />
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
          Search {marketplaceLabel} to find your pair, or scan the box barcode.
        </p>
      </div>

      {scanError ? <p className="text-sm text-destructive">{scanError}</p> : null}

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
          className={cn(
            'grid grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2',
            RESULTS_MAX_HEIGHT,
          )}
        >
          {(['one', 'two', 'three', 'four'] as const).map((key) => (
            <div key={key} className="flex min-w-0 items-center gap-4 rounded-md border p-3">
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
          {`No sneakers found on ${marketplaceLabel} for “${searchQuery}”.`}
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
                  onClick={() => onSelect(result)}
                  className={cn(
                    'flex w-full min-w-0 items-center gap-4 overflow-hidden rounded-md border p-3 text-left transition-colors hover:bg-accent/50',
                    isSelected && 'border-primary bg-accent/40',
                  )}
                >
                  <SneakerThumbnail
                    imageUrl={result.imageUrl}
                    alt={result.title}
                    className={RESULT_THUMBNAIL_CLASS}
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
