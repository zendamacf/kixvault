import {
  type DepartureType,
  departureAllowsSalePrice,
  departureTypes,
  type RetireSneakerInput,
} from '@kixvault/shared';
import { i18n } from '@/i18n';
import { formatDate } from '@/lib/utils';
import { parseIsoDate } from '@/lib/wears';

export { departureAllowsSalePrice, departureTypes };

export function formatDepartureType(type: DepartureType): string {
  return i18n.t(`departure.types.${type}`);
}

/** Formats a `YYYY-MM-DD` departure date in the viewer's calendar, so it never shifts a day. */
export function formatDepartureDate(value: string | null | undefined): string {
  return formatDate(value ? parseIsoDate(value) : null);
}

export type RetireFormValues = {
  departureType: DepartureType;
  /** `YYYY-MM-DD` */
  departedOn: string;
  salePrice: string;
  notes: string;
};

export type RetireFormErrors = Partial<Record<'departedOn' | 'salePrice', string>>;

/** Checks the retire form and builds the API input. `today` is the viewer's `YYYY-MM-DD`. */
export function validateRetireForm(
  values: RetireFormValues,
  today: string,
): { errors: RetireFormErrors; input: RetireSneakerInput | null } {
  const errors: RetireFormErrors = {};
  const allowsPrice = departureAllowsSalePrice(values.departureType);
  const priceText = values.salePrice.trim();

  if (!values.departedOn) {
    errors.departedOn = i18n.t('retire.errors.date');
  } else if (values.departedOn > today) {
    errors.departedOn = i18n.t('retire.errors.dateFuture');
  }

  if (allowsPrice) {
    if (priceText === '' && values.departureType === 'sold') {
      errors.salePrice = i18n.t('retire.errors.salePrice');
    } else if (priceText !== '' && !(Number(priceText) >= 0)) {
      errors.salePrice = i18n.t('retire.errors.salePriceInvalid');
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, input: null };
  }

  const notes = values.notes.trim();

  return {
    errors,
    input: {
      departureType: values.departureType,
      departedOn: values.departedOn,
      ...(allowsPrice && priceText !== '' ? { salePrice: Number(priceText) } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}
