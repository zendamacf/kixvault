import type { CatalogSearchResult } from "@kixvault/shared";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogSearchQueryOptions } from "@/lib/catalog";
import { useDebouncedValue } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const DEBOUNCE_DELAY = 2000;

type CatalogSearchPickerProps = {
  onSelect: (result: CatalogSearchResult) => void;
  selectedCatalogId?: string | null;
};

export function CatalogSearchPicker({ onSelect, selectedCatalogId }: CatalogSearchPickerProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), DEBOUNCE_DELAY);
  const canSearch = debouncedQuery.length >= 2;

  const { data, isLoading, isFetching, error } = useQuery({
    ...catalogSearchQueryOptions(debouncedQuery),
    enabled: canSearch,
  });

  const results = data?.results ?? [];
  const unavailable = data?.unavailable ?? false;

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div className="space-y-2">
        <Label htmlFor="catalog-search">Find a sneaker</Label>
        <Input
          id="catalog-search"
          placeholder="Search by name or SKU (e.g. Air Jordan 1 Chicago, DZ5485-100)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Search StockX catalog to pre-fill brand, model, and colorway.
        </p>
      </div>

      {!canSearch && query.trim().length > 0 ? (
        <p className="text-sm text-muted-foreground">Type at least 2 characters to search.</p>
      ) : null}

      {unavailable ? (
        <p className="text-sm text-muted-foreground">
          Catalog search is unavailable. Add details manually below.
        </p>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

      {canSearch && (isLoading || isFetching) ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : null}

      {canSearch && !isLoading && !isFetching && !error && !unavailable && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No sneakers found for &ldquo;{debouncedQuery}&rdquo;.
        </p>
      ) : null}

      {results.length > 0 ? (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {results.map((result) => {
            const isSelected = selectedCatalogId === result.catalogId;

            return (
              <li key={result.catalogId}>
                <button
                  type="button"
                  onClick={() => onSelect(result)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-accent/50",
                    isSelected && "border-primary bg-accent/40",
                  )}
                >
                  {result.imageUrl ? (
                    <img
                      src={result.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-md bg-muted object-contain"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
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
