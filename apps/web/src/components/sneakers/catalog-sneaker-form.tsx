import type {
  CatalogMarketplace,
  CatalogSearchResult,
  CreateSneakerFromCatalogInput,
} from '@kixvault/shared';
import { useState } from 'react';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { CollectionSneakerForm } from '@/components/sneakers/collection-sneaker-form';

type CatalogSneakerFormProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CreateSneakerFromCatalogInput) => Promise<void>;
};

export function CatalogSneakerForm({
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: CatalogSneakerFormProps) {
  const [selectedResult, setSelectedResult] = useState<CatalogSearchResult | null>(null);
  const [query, setQuery] = useState('');
  const [marketplace, setMarketplace] = useState<CatalogMarketplace>('goat');

  return (
    <div className="grid gap-5">
      {!selectedResult ? (
        <CatalogSearchPicker
          query={query}
          onQueryChange={setQuery}
          marketplace={marketplace}
          onMarketplaceChange={setMarketplace}
          onSelect={setSelectedResult}
        />
      ) : (
        <>
          <button
            type="button"
            className="inline-flex w-fit text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedResult(null)}
          >
            ← Back to search
          </button>

          <CollectionSneakerForm
            summary={{
              imageUrl: selectedResult.imageUrl,
              title: selectedResult.title,
              brand: selectedResult.brand,
              nickname: selectedResult.nickname,
              colorway: selectedResult.colorway,
              sku: selectedResult.sku,
            }}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            onSubmit={async (values) => {
              await onSubmit({
                catalogSource: selectedResult.catalogSource,
                catalogId: selectedResult.catalogId,
                ...values,
              });
            }}
          />
        </>
      )}
    </div>
  );
}
