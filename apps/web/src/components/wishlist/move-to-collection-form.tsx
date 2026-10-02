import { zodResolver } from '@hookform/resolvers/zod';
import {
  type MoveWishlistToCollectionInput,
  moveWishlistToCollectionSchema,
} from '@kixvault/shared';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SneakerCollectionFields } from '@/components/sneakers/sneaker-collection-fields';
import { Button } from '@/components/ui/button';

const formSchema = moveWishlistToCollectionSchema.omit({ size: true }).extend({
  size: z.number({ error: 'Size is required' }).positive().max(99),
  purchasePrice: z
    .number()
    .nonnegative()
    .optional()
    .nullable()
    .or(z.nan().transform(() => undefined)),
});

type FormValues = z.infer<typeof formSchema>;

type CollectionFieldValues = {
  size: number;
  condition: FormValues['condition'];
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
};

type MoveToCollectionFormProps = {
  isSubmitting?: boolean;
  onSubmit: (values: MoveWishlistToCollectionInput) => Promise<void>;
};

/** Converts a grail into an owned pair in the vault. */
export function MoveToCollectionForm({
  isSubmitting = false,
  onSubmit,
}: MoveToCollectionFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      condition: 'deadstock',
      purchaseDate: '',
      notes: '',
    },
  });

  return (
    <form
      className="grid gap-4 rounded-lg border border-border bg-card p-4"
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
      <div>
        <h2 className="text-lg font-semibold">Move to collection</h2>
        <p className="text-sm text-muted-foreground">
          Add this grail to your vault and remove it from your wishlist.
        </p>
      </div>
      <SneakerCollectionFields
        register={register as unknown as UseFormRegister<CollectionFieldValues>}
        control={control as unknown as Control<CollectionFieldValues>}
        errors={errors as FieldErrors<CollectionFieldValues>}
      />
      <Button type="submit" disabled={isSubmitting}>
        Move to collection
      </Button>
    </form>
  );
}
