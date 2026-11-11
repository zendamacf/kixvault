import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  departureAllowsSalePrice,
  departureTypes,
  formatDepartureType,
  type RetireFormErrors,
  type RetireFormValues,
  validateRetireForm,
} from '@/lib/departure';
import { useRetireSneaker } from '@/lib/retire-actions';
import { cn } from '@/lib/utils';
import { toIsoDate } from '@/lib/wears';

type RetireFormProps = {
  sneakerId: string;
  /** Used in the confirmation message. */
  label: string;
  onBack: () => void;
  onRetired: () => void;
};

/** Asks how a pair left the vault, when, and for how much when it was sold or traded. */
export function RetireForm({ sneakerId, label, onBack, onRetired }: RetireFormProps) {
  const { t } = useTranslation();
  const today = toIsoDate(new Date());
  const [values, setValues] = useState<RetireFormValues>({
    departureType: 'sold',
    departedOn: today,
    salePrice: '',
    notes: '',
  });
  const [errors, setErrors] = useState<RetireFormErrors>({});
  const retire = useRetireSneaker({ onRetired });

  const showPrice = departureAllowsSalePrice(values.departureType);

  function update<K extends keyof RetireFormValues>(key: K, value: RetireFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateRetireForm(values, today);
    setErrors(result.errors);

    if (result.input) {
      retire.mutate({ sneakerId, label, input: result.input });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <fieldset className="min-w-0 space-y-2 border-0 p-0">
        <legend className="mb-2 text-sm font-medium">{t('retire.typeLegend')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {departureTypes.map((type) => (
            <label
              key={type}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                values.departureType === type
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-input bg-card text-foreground hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name="departureType"
                value={type}
                checked={values.departureType === type}
                onChange={() => {
                  update('departureType', type);
                  setErrors((current) => ({ ...current, salePrice: undefined }));
                }}
                className="sr-only"
              />
              {formatDepartureType(type)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={cn('grid gap-4', showPrice && 'sm:grid-cols-2')}>
        <div className="space-y-2">
          <Label htmlFor="retire-date">{t('retire.dateLabel')}</Label>
          <Input
            id="retire-date"
            type="date"
            max={today}
            value={values.departedOn}
            aria-invalid={errors.departedOn ? true : undefined}
            aria-describedby={errors.departedOn ? 'retire-date-error' : undefined}
            onChange={(event) => update('departedOn', event.target.value)}
          />
          {errors.departedOn ? (
            <p id="retire-date-error" className="text-sm text-destructive">
              {errors.departedOn}
            </p>
          ) : null}
        </div>

        {showPrice ? (
          <div className="space-y-2">
            <Label htmlFor="retire-price">
              {values.departureType === 'sold'
                ? t('retire.salePriceSold')
                : t('retire.salePriceTraded')}
            </Label>
            <Input
              id="retire-price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={values.salePrice}
              aria-invalid={errors.salePrice ? true : undefined}
              aria-describedby={errors.salePrice ? 'retire-price-error' : undefined}
              onChange={(event) => update('salePrice', event.target.value)}
            />
            {errors.salePrice ? (
              <p id="retire-price-error" className="text-sm text-destructive">
                {errors.salePrice}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="retire-notes">{t('retire.notesLabel')}</Label>
        <Textarea
          id="retire-notes"
          maxLength={2000}
          placeholder={t('retire.notesPlaceholder')}
          value={values.notes}
          onChange={(event) => update('notes', event.target.value)}
        />
      </div>

      {retire.error ? (
        <p className="text-sm text-destructive" role="alert">
          {retire.error.message}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={retire.isPending}>
          {t('retire.back')}
        </Button>
        <Button type="submit" disabled={retire.isPending}>
          {retire.isPending ? t('retire.submitting') : t('retire.submit')}
        </Button>
      </div>
    </form>
  );
}
