import { zodResolver } from '@hookform/resolvers/zod';
import {
  type CatalogSearchResult,
  type CreateSneakerInput,
  createSneakerSchema,
  sneakerConditions,
} from '@kixvault/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CatalogSearchPicker } from '@/components/sneakers/catalog-search-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCondition } from '@/lib/utils';

type SneakerFormProps = {
  defaultValues?: Partial<CreateSneakerInput>;
  submitLabel: string;
  isSubmitting?: boolean;
  enableCatalogSearch?: boolean;
  onSubmit: (values: CreateSneakerInput) => Promise<void>;
};

export function SneakerForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  enableCatalogSearch = false,
  onSubmit,
}: SneakerFormProps) {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string | null>(
    defaultValues?.catalogId ?? null,
  );
  const [showForm, setShowForm] = useState(!enableCatalogSearch);
  const lockModelDetails = Boolean(defaultValues?.sku);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<CreateSneakerInput>({
    resolver: zodResolver(createSneakerSchema),
    defaultValues: {
      brand: '',
      model: '',
      colorway: '',
      size: undefined,
      condition: 'deadstock',
      purchasePrice: undefined,
      purchaseDate: '',
      notes: '',
      sku: null,
      imageUrl: null,
      catalogSource: null,
      catalogId: null,
      ...defaultValues,
    },
  });

  function applyCatalogResult(result: CatalogSearchResult) {
    setSelectedCatalogId(result.catalogId);
    setShowForm(true);
    reset({
      ...getValues(),
      brand: result.brand,
      model: result.model,
      colorway: result.colorway ?? '',
      sku: result.sku,
      imageUrl: result.imageUrl,
      catalogSource: result.catalogSource,
      catalogId: result.catalogId,
    });
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        const normalized = {
          ...values,
          colorway: values.colorway || null,
          purchasePrice: values.purchasePrice ?? null,
          purchaseDate: values.purchaseDate || null,
          notes: values.notes || null,
          sku: values.sku ?? null,
          imageUrl: values.imageUrl ?? null,
          catalogSource: values.catalogSource ?? null,
          catalogId: values.catalogId ?? null,
        };

        if (lockModelDetails) {
          await onSubmit({
            ...normalized,
            brand: defaultValues?.brand ?? values.brand,
            model: defaultValues?.model ?? values.model,
            colorway: defaultValues?.colorway ?? null,
            sku: defaultValues?.sku ?? null,
            imageUrl: defaultValues?.imageUrl ?? null,
            catalogSource: defaultValues?.catalogSource ?? null,
            catalogId: defaultValues?.catalogId ?? null,
          });
          return;
        }

        await onSubmit(normalized);
      })}
    >
      {enableCatalogSearch ? (
        <>
          <CatalogSearchPicker
            selectedCatalogId={selectedCatalogId}
            onSelect={applyCatalogResult}
            onMarketplaceChange={() => setSelectedCatalogId(null)}
          />
          {!showForm ? (
            <Button type="button" variant="outline" onClick={() => setShowForm(true)}>
              Enter details manually
            </Button>
          ) : null}
        </>
      ) : null}

      {showForm ? (
        <>
          {lockModelDetails ? (
            <p className="text-sm text-muted-foreground">
              Model details are linked to the catalog (SKU {defaultValues?.sku}) and cannot be
              edited.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                placeholder="Nike"
                readOnly={lockModelDetails}
                className={lockModelDetails ? 'cursor-default bg-muted' : undefined}
                {...register('brand')}
              />
              {errors.brand ? (
                <p className="text-sm text-destructive">{errors.brand.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Air Jordan 1"
                readOnly={lockModelDetails}
                className={lockModelDetails ? 'cursor-default bg-muted' : undefined}
                {...register('model')}
              />
              {errors.model ? (
                <p className="text-sm text-destructive">{errors.model.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorway">Colorway</Label>
              <Input
                id="colorway"
                placeholder="Chicago"
                readOnly={lockModelDetails}
                className={lockModelDetails ? 'cursor-default bg-muted' : undefined}
                {...register('colorway')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input id="size" type="number" step="0.5" placeholder="10" {...register('size')} />
              {errors.size ? (
                <p className="text-sm text-destructive">{errors.size.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select id="condition" {...register('condition')}>
                {sneakerConditions.map((condition) => (
                  <option key={condition} value={condition}>
                    {formatCondition(condition)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase price</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="1"
                placeholder="180"
                {...register('purchasePrice')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase date (optional)</Label>
              <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
              {errors.purchaseDate ? (
                <p className="text-sm text-destructive">{errors.purchaseDate.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Where you bought them, lace swap, etc."
              {...register('notes')}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </>
      ) : null}
    </form>
  );
}
