import { zodResolver } from '@hookform/resolvers/zod';
import {
  type CatalogMarketplace,
  type CatalogSearchResult,
  type CreateSneakerFromCatalogInput,
  createSneakerFromCatalogSchema,
} from '@kixvault/shared';
import { useState } from 'react';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { SneakerBrandBadge } from '@/components/sneakers/sneaker-brand-badge';
import { SneakerCollectionFields } from '@/components/sneakers/sneaker-collection-fields';
import { SneakerThumbnail } from '@/components/sneakers/sneaker-thumbnail';
import { Button } from '@/components/ui/button';

const catalogSneakerFormSchema = createSneakerFromCatalogSchema
  .omit({ catalogSource: true, catalogId: true })
  .extend({
    size: z.number({ error: 'Size is required' }).positive().max(99),
    purchasePrice: z
      .number()
      .nonnegative()
      .optional()
      .nullable()
      .or(z.nan().transform(() => undefined)),
  });

type CatalogSneakerFormValues = z.infer<typeof catalogSneakerFormSchema>;

type CollectionFieldValues = {
  size: number;
  condition: CatalogSneakerFormValues['condition'];
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
};

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

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CatalogSneakerFormValues>({
    resolver: zodResolver(catalogSneakerFormSchema),
    defaultValues: {
      size: undefined,
      condition: 'deadstock',
      purchaseDate: '',
      notes: '',
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        if (!selectedResult) {
          return;
        }

        await onSubmit({
          catalogSource: selectedResult.catalogSource,
          catalogId: selectedResult.catalogId,
          size: values.size,
          condition: values.condition,
          purchasePrice: values.purchasePrice ?? null,
          purchaseDate: values.purchaseDate || null,
          notes: values.notes || null,
        });
      })}
    >
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

          <div className="flex gap-4 rounded-lg border bg-background/60 p-4">
            <SneakerThumbnail
              imageUrl={selectedResult.imageUrl}
              alt={selectedResult.title}
              className="h-24 w-24 shrink-0"
            />
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{selectedResult.title}</p>
              <SneakerBrandBadge brand={selectedResult.brand} />
              {selectedResult.nickname ? (
                <p className="text-sm text-foreground">{`"${selectedResult.nickname}"`}</p>
              ) : null}
              {selectedResult.colorway ? (
                <p className="text-sm text-muted-foreground">{selectedResult.colorway}</p>
              ) : null}
              <p className="text-sm text-muted-foreground">SKU {selectedResult.sku}</p>
            </div>
          </div>

          <SneakerCollectionFields
            register={register as unknown as UseFormRegister<CollectionFieldValues>}
            control={control as unknown as Control<CollectionFieldValues>}
            errors={errors as FieldErrors<CollectionFieldValues>}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </>
      )}
    </form>
  );
}
