import { zodResolver } from '@hookform/resolvers/zod';
import {
  type MoveWishlistToCollectionInput,
  moveWishlistToCollectionSchema,
} from '@kixvault/shared';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { SneakerCollectionFields } from '@/components/sneakers/sneaker-collection-fields';
import { Button } from '@/components/ui/button';
import { i18n } from '@/i18n';

const formSchema = moveWishlistToCollectionSchema.omit({ size: true }).extend({
  size: z
    .number({ error: () => i18n.t('forms.sizeRequired') })
    .positive()
    .max(99),
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
  const { t } = useTranslation();
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
      className="grid gap-5 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6"
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
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          {t('wishlist.moveTitle')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('wishlist.moveDescription')}</p>
      </div>
      <SneakerCollectionFields
        register={register as unknown as UseFormRegister<CollectionFieldValues>}
        control={control as unknown as Control<CollectionFieldValues>}
        errors={errors as FieldErrors<CollectionFieldValues>}
      />
      <Button type="submit" size="lg" className="sm:w-fit" disabled={isSubmitting}>
        {t('wishlist.moveTitle')}
      </Button>
    </form>
  );
}
