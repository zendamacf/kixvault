import type {
  CatalogSearchResult,
  CreateSneakerFromCatalogInput,
  VariantPrice,
} from '@kixvault/shared';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { CollectionSneakerForm } from '@/components/sneakers/collection-sneaker-form';
import { Skeleton } from '@/components/ui/skeleton';
import { catalogProductQueryOptions } from '@/lib/catalog';

type CatalogSneakerFormProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateSneakerFromCatalogInput) => Promise<void>;
};

/** Catalog search flow for adding a sneaker via the from-catalog API. */
export function CatalogSneakerForm({
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: CatalogSneakerFormProps) {
  const [selectedResult, setSelectedResult] = useState<CatalogSearchResult | null>(null);
  const [query, setQuery] = useState('');

  const {
    data: catalogProduct,
    isLoading,
    error,
  } = useQuery({
    ...catalogProductQueryOptions(selectedResult?.catalogId ?? ''),
    enabled: selectedResult != null,
  });

  const summary = catalogProduct?.product ?? selectedResult;
  const variantPrices: VariantPrice[] = catalogProduct?.variantPrices ?? [];

  return (
    <div className="grid gap-5">
      {!selectedResult ? (
        <CatalogSearchPicker query={query} onQueryChange={setQuery} onSelect={setSelectedResult} />
      ) : (
        <>
          <button
            type="button"
            className="inline-flex w-fit text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedResult(null)}
          >
            ← Back to search
          </button>

          {isLoading ? (
            <div className="space-y-4 rounded-lg border bg-background/60 p-4">
              <Skeleton className="h-48 w-48 rounded-md" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error.message}</p> : null}

          {catalogProduct?.unavailable ? (
            <p className="text-sm text-muted-foreground">
              Catalog pricing is unavailable. You can still add this pair, but market value will not
              be stored.
            </p>
          ) : null}

          {summary ? (
            <CollectionSneakerForm
              summary={{
                imageUrl: summary.imageUrl,
                title: summary.title,
                brand: summary.brand,
                nickname: summary.nickname,
                colorway: summary.colorway,
                sku: summary.sku,
              }}
              variantPrices={variantPrices}
              submitLabel={submitLabel}
              isSubmitting={isSubmitting || isLoading}
              onSubmit={async (values) => {
                await onSubmit({
                  catalogSource: 'kicksdb:stockx',
                  catalogId: selectedResult.catalogId,
                  ...values,
                });
              }}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
