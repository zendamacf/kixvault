import { zodResolver } from '@hookform/resolvers/zod';
import {
  type CreateWishlistItemInput,
  createWishlistItemSchema,
  wishlistPriorities,
} from '@kixvault/shared';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  brand: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  colorway: z.string().trim().max(100).optional().nullable(),
  targetSize: z
    .number()
    .positive()
    .max(99)
    .optional()
    .nullable()
    .or(z.nan().transform(() => null)),
  priority: z.enum(wishlistPriorities),
  notes: z.string().trim().max(2000).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type WishlistManualFormProps = {
  submitLabel: string;
  isSubmitting?: boolean;
  defaultValues?: Partial<FormValues>;
  onSubmit: (values: CreateWishlistItemInput) => Promise<void>;
};

/** Manual form for adding a grail without catalog search. */
export function WishlistManualForm({
  submitLabel,
  isSubmitting = false,
  defaultValues,
  onSubmit,
}: WishlistManualFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      brand: '',
      model: '',
      colorway: '',
      targetSize: null,
      priority: 'medium',
      notes: '',
      ...defaultValues,
    },
  });

  const priority = watch('priority');

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        const parsed = createWishlistItemSchema.parse({
          ...values,
          colorway: values.colorway || null,
          notes: values.notes || null,
        });
        await onSubmit(parsed);
      })}
    >
      <div className="grid gap-2">
        <Label htmlFor="brand">Brand</Label>
        <Input id="brand" {...register('brand')} />
        {errors.brand ? <p className="text-sm text-destructive">{errors.brand.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="model">Model</Label>
        <Input id="model" {...register('model')} />
        {errors.model ? <p className="text-sm text-destructive">{errors.model.message}</p> : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="colorway">Colorway</Label>
        <Input id="colorway" {...register('colorway')} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="targetSize">Target size (optional)</Label>
          <Input
            id="targetSize"
            type="number"
            step="0.5"
            {...register('targetSize', { valueAsNumber: true })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={priority}
            onValueChange={(value) => setValue('priority', value as FormValues['priority'])}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...register('notes')} />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
