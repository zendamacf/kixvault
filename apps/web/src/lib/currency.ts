import { BASE_CURRENCY } from '@kixvault/shared';

/** Largest amount the `numeric(10,2)` USD columns can hold. */
const MAX_USD = 99_999_999.99;

type ActiveCurrency = { code: string; rate: number };

let active: ActiveCurrency = { code: BASE_CURRENCY, rate: 1 };

/** Units of `code` per 1 USD. Falls back to USD when the rate is unusable. */
export function setActiveCurrency(code: string, rate: number) {
  active =
    code !== BASE_CURRENCY && Number.isFinite(rate) && rate > 0
      ? { code, rate }
      : { code: BASE_CURRENCY, rate: 1 };
}

export function getActiveCurrency(): Readonly<ActiveCurrency> {
  return active;
}

export function usdToDisplay(usd: number): number {
  return usd * active.rate;
}

/** Number of decimals the active currency uses (0 for JPY, KRW, ...). */
export function currencyFractionDigits(code = active.code): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** An amount the user would type into an input: converted and rounded to the currency's precision. */
export function usdToInputAmount(usd: number): number {
  return roundTo(usdToDisplay(usd), currencyFractionDigits());
}

/**
 * Converts what the user typed back to USD for storage, rounded to cents and capped at the column
 * limit. When `originalUsd` is given and the input is just that value shown in the active
 * currency, the original is returned so an unchanged edit does not drift the stored amount.
 */
export function inputAmountToUsd(amount: number, originalUsd?: number | null): number {
  if (originalUsd != null && amount === usdToInputAmount(originalUsd)) {
    return originalUsd;
  }

  return Math.min(roundTo(amount / active.rate, 2), MAX_USD);
}

/** `step` attribute for money inputs in the active currency. */
export function currencyInputStep(): string {
  return currencyFractionDigits() === 0 ? '1' : '0.01';
}
