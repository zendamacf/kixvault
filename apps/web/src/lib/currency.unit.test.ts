import { afterEach, describe, expect, test } from 'bun:test';
import {
  currencyFractionDigits,
  currencyInputStep,
  inputAmountToUsd,
  setActiveCurrency,
  usdToDisplay,
  usdToInputAmount,
} from './currency';

afterEach(() => setActiveCurrency('USD', 1));

describe('currency conversion', () => {
  test('is the identity for USD', () => {
    expect(usdToDisplay(180)).toBe(180);
    expect(inputAmountToUsd(180.5)).toBe(180.5);
  });

  test('converts to and from the active currency', () => {
    setActiveCurrency('EUR', 0.9);

    expect(usdToDisplay(200)).toBeCloseTo(180);
    expect(inputAmountToUsd(180)).toBe(200);
  });

  test('rounds stored USD to cents and caps at the column limit', () => {
    setActiveCurrency('EUR', 0.9);
    expect(inputAmountToUsd(100)).toBe(111.11);

    expect(inputAmountToUsd(1e12)).toBe(99_999_999.99);
  });

  test('keeps the original USD value when the input is unchanged', () => {
    setActiveCurrency('EUR', 0.9234);
    const original = 123.45;
    const shown = usdToInputAmount(original);

    expect(inputAmountToUsd(shown, original)).toBe(original);
    expect(inputAmountToUsd(shown + 1, original)).not.toBe(original);
  });

  test('falls back to USD on an unusable rate', () => {
    setActiveCurrency('EUR', 0);

    expect(usdToDisplay(10)).toBe(10);
  });

  test('uses the currency precision for inputs', () => {
    setActiveCurrency('JPY', 150);

    expect(currencyFractionDigits()).toBe(0);
    expect(currencyInputStep()).toBe('1');
    expect(usdToInputAmount(10.01)).toBe(1502);
  });
});
