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
  onSubmit: (values: CreateSneakerInput) => Promise<void>;
};

/** Full manual entry form for brand, model, and collection fields. */
export function ManualSneakerForm({
  defaultValues,
  submitLabel,
  isSubmitting = false,
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
        await onSubmit({
          brand: values.brand,
          model: values.model,
          colorway: values.colorway || null,
          nickname: values.nickname?.trim() || null,
          size: values.size,
          condition: values.condition,
          purchasePrice: values.purchasePrice ?? null,
          purchaseDate: values.purchaseDate || null,
          notes: values.notes || null,
          sku: null,
          images: [],
          catalogSource: null,
          catalogId: null,
          releaseDate: null,
          description: null,
        });
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand">Brand</Label>
          <Input id="brand" placeholder="Nike" {...register('brand')} />
          {errors.brand ? <p className="text-sm text-destructive">{errors.brand.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" placeholder="Air Jordan 1" {...register('model')} />
          {errors.model ? <p className="text-sm text-destructive">{errors.model.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="colorway">Colorway</Label>
          <Input id="colorway" placeholder="Chicago" {...register('colorway')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nickname">Nickname</Label>
          <Input id="nickname" placeholder="Chicago" {...register('nickname')} />
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
