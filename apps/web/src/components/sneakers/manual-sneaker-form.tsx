import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateSneakerInput, createSneakerSchema } from '@kixvault/shared';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SneakerCollectionFields } from '@/components/sneakers/sneaker-collection-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const manualSneakerFormSchema = createSneakerSchema.extend({
  size: z.number({ error: 'Size is required' }).positive().max(99),
  purchasePrice: z
    .number()
    .nonnegative()
    .optional()
    .nullable()
    .or(z.nan().transform(() => undefined)),
});

type ManualSneakerFormValues = z.infer<typeof manualSneakerFormSchema>;

type CollectionFieldValues = {
  size: number;
  condition: ManualSneakerFormValues['condition'];
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
};

type ManualSneakerFormProps = {
  defaultValues?: Partial<CreateSneakerInput>;
  submitLabel: string;
  isSubmitting?: boolean;
  lockModelDetails?: boolean;
  onSubmit: (values: CreateSneakerInput) => Promise<void>;
};

export function ManualSneakerForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
  lockModelDetails = false,
  onSubmit,
}: ManualSneakerFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ManualSneakerFormValues>({
    resolver: zodResolver(manualSneakerFormSchema),
    defaultValues: {
      brand: '',
      model: '',
      colorway: '',
      size: undefined,
      condition: 'deadstock',
      purchaseDate: '',
      notes: '',
      ...defaultValues,
      purchasePrice: defaultValues?.purchasePrice ?? undefined,
      nickname: defaultValues?.nickname ?? '',
    },
  });

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit(async (values) => {
        const normalized = {
          brand: values.brand,
          model: values.model,
          colorway: values.colorway || null,
          nickname: values.nickname?.trim() || null,
          size: values.size,
          condition: values.condition,
          purchasePrice: values.purchasePrice ?? null,
          purchaseDate: values.purchaseDate || null,
          notes: values.notes || null,
          sku: lockModelDetails ? (defaultValues?.sku ?? null) : null,
          imageUrl: lockModelDetails ? (defaultValues?.imageUrl ?? null) : null,
          catalogSource: lockModelDetails ? (defaultValues?.catalogSource ?? null) : null,
          catalogId: lockModelDetails ? (defaultValues?.catalogId ?? null) : null,
          releaseDate: lockModelDetails ? (defaultValues?.releaseDate ?? null) : null,
          description: lockModelDetails ? (defaultValues?.description ?? null) : null,
        };

        if (lockModelDetails) {
          await onSubmit({
            ...normalized,
            brand: defaultValues?.brand ?? values.brand,
            model: defaultValues?.model ?? values.model,
            colorway: defaultValues?.colorway ?? null,
            nickname: defaultValues?.nickname ?? null,
          });
          return;
        }

        await onSubmit(normalized);
      })}
    >
      {lockModelDetails ? (
        <p className="text-sm text-muted-foreground">
          Model details are linked to the catalog (SKU {defaultValues?.sku}) and cannot be edited.
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
          {errors.brand ? <p className="text-sm text-destructive">{errors.brand.message}</p> : null}
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
          {errors.model ? <p className="text-sm text-destructive">{errors.model.message}</p> : null}
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
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            placeholder="Chicago"
            readOnly={lockModelDetails}
            className={lockModelDetails ? 'cursor-default bg-muted' : undefined}
            {...register('nickname')}
          />
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
    </form>
  );
}
