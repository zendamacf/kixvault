import { zodResolver } from '@hookform/resolvers/zod';
import type { VariantPrice } from '@kixvault/shared';
import { createSneakerFromCatalogSchema, type SneakerCondition } from '@kixvault/shared';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import {
  CatalogSneakerSummary,
  type CatalogSneakerSummaryData,
} from '@/components/sneakers/catalog-sneaker-summary';
import { CatalogMarketPricePreview } from '@/components/sneakers/market-value';
import { SneakerCollectionFields } from '@/components/sneakers/sneaker-collection-fields';
import { Button } from '@/components/ui/button';

const collectionSneakerFormSchema = createSneakerFromCatalogSchema
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

export type CollectionSneakerFormValues = z.infer<typeof collectionSneakerFormSchema>;

type CollectionFieldValues = {
  size: number;
  condition: CollectionSneakerFormValues['condition'];
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
};

type CollectionSneakerFormProps = {
  summary: CatalogSneakerSummaryData;
  variantPrices?: VariantPrice[];
  defaultValues?: Partial<CollectionSneakerFormValues>;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: CollectionSneakerFormValues) => Promise<void>;
};

/** Form with a read-only catalog summary and editable collection fields. */
export function CollectionSneakerForm({
  summary,
  variantPrices = [],
  defaultValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: CollectionSneakerFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CollectionSneakerFormValues>({
    resolver: zodResolver(collectionSneakerFormSchema),
    defaultValues: {
      size: undefined,
      condition: 'deadstock' as SneakerCondition,
      purchaseDate: '',
      notes: '',
      ...defaultValues,
      purchasePrice: defaultValues?.purchasePrice ?? undefined,
    },
  });

  const size = useWatch({ control, name: 'size' });
  const condition = useWatch({ control, name: 'condition' });
  const purchasePrice = useWatch({ control, name: 'purchasePrice' });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          size: values.size,
          condition: values.condition,
          purchasePrice: values.purchasePrice ?? null,
          purchaseDate: values.purchaseDate || null,
          notes: values.notes || null,
        });
      })}
    >
      <CatalogSneakerSummary sneaker={summary} />

      <SneakerCollectionFields
        register={register as unknown as UseFormRegister<CollectionFieldValues>}
        control={control as unknown as Control<CollectionFieldValues>}
        errors={errors as FieldErrors<CollectionFieldValues>}
      />

      {variantPrices.length > 0 ? (
        <CatalogMarketPricePreview
          size={size}
          condition={condition}
          variantPrices={variantPrices}
          purchasePrice={purchasePrice}
        />
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
