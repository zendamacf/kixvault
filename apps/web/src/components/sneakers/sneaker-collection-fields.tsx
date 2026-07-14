import { sneakerConditions } from '@kixvault/shared';
import type { Control, FieldErrors, UseFormRegister } from 'react-hook-form';
import { Controller } from 'react-hook-form';
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
import { formatCondition } from '@/lib/utils';

type CollectionFieldValues = {
  size: number;
  condition: (typeof sneakerConditions)[number];
  purchasePrice?: number | null;
  purchaseDate?: string | null;
  notes?: string | null;
};

type SneakerCollectionFieldsProps = {
  register: UseFormRegister<CollectionFieldValues>;
  control: Control<CollectionFieldValues>;
  errors: FieldErrors<CollectionFieldValues>;
};

/** Shared form fields for size, condition, purchase price/date, and notes. */
export function SneakerCollectionFields({
  register,
  control,
  errors,
}: SneakerCollectionFieldsProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input
            id="size"
            type="number"
            step="0.5"
            placeholder="10"
            {...register('size', { valueAsNumber: true })}
          />
          {errors.size ? <p className="text-sm text-destructive">{errors.size.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Condition</Label>
          <Controller
            name="condition"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="condition" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sneakerConditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {formatCondition(condition)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchasePrice">Purchase price</Label>
          <Input
            id="purchasePrice"
            type="number"
            step="1"
            placeholder="180"
            {...register('purchasePrice', {
              setValueAs: (value) => (value === '' ? undefined : Number(value)),
            })}
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
    </>
  );
}
