import type { CatalogMarketplace, CatalogSearchResult } from "@kixvault/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SneakerThumbnail } from "@/components/sneakers/sneaker-thumbnail";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogSearchQueryOptions } from "@/lib/catalog";
import { useDebouncedValue } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const DEBOUNCE_DELAY = 1000;

type CatalogSearchPickerProps = {
  onSelect: (result: CatalogSearchResult) => void;
  selectedCatalogId?: string | null;
  onMarketplaceChange?: () => void;
};

export function CatalogSearchPicker({
  onSelect,
  selectedCatalogId,
  onMarketplaceChange,
}: CatalogSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [marketplace, setMarketplace] = useState<CatalogMarketplace>("goat");
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_DELAY);
  const canSearch = debouncedQuery.length >= 2;

  const { data, isLoading, isFetching, error } = useQuery({
    ...catalogSearchQueryOptions(debouncedQuery, marketplace),
    enabled: canSearch,
  });

  const results = data?.results ?? [];
  const unavailable = data?.unavailable ?? false;
  const marketplaceLabel = marketplace === "stockx" ? "StockX" : "GOAT";

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
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            id="catalog-marketplace"
            aria-label="Marketplace"
            className="w-28 shrink-0"
            value={marketplace}
            onChange={(event) => {
              setMarketplace(event.target.value as CatalogMarketplace);
              onMarketplaceChange?.();
            }}
          >
            <option value="stockx">StockX</option>
            <option value="goat">GOAT</option>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Search {marketplaceLabel} to pre-fill brand, model, and colorway.
        </p>
      </div>

      {!canSearch && query.trim().length > 0 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : null}

      {unavailable ? (
        <p className="text-sm text-muted-foreground">
          Catalog search is unavailable. Use the button below to enter details manually.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      {canSearch && (isLoading || isFetching) ? (
        <div className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {(["one", "two", "three", "four"] as const).map((key) => (
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
        <ul className="grid max-h-96 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {results.map((result) => {
            const isSelected = selectedCatalogId === result.catalogId;

            return (
              <li key={`${result.catalogSource}:${result.catalogId}`} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(result)}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-4 overflow-hidden rounded-md border p-3 text-left transition-colors hover:bg-accent/50",
                    isSelected && "border-primary bg-accent/40",
                  )}
                >
                  <SneakerThumbnail
                    imageUrl={result.imageUrl}
                    alt={result.title}
                    className="h-24 w-24 shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{result.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {result.brand} · {result.sku}
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
