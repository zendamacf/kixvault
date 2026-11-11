import { describe, expect, test } from 'bun:test';
import { formatDepartureDate, formatDepartureType, validateRetireForm } from './departure';

const today = '2026-11-12';
const base = { departureType: 'sold' as const, departedOn: '2026-11-01', salePrice: '', notes: '' };

describe('validateRetireForm', () => {
  test('requires a sale price for sold pairs', () => {
    const result = validateRetireForm(base, today);

    expect(result.input).toBeNull();
    expect(result.errors.salePrice).toBe('Enter the sale price.');
  });

  test('builds the input for a sold pair', () => {
    const result = validateRetireForm({ ...base, salePrice: '250.50', notes: '  eBay  ' }, today);

    expect(result.errors).toEqual({});
    expect(result.input).toEqual({
      departureType: 'sold',
      departedOn: '2026-11-01',
      salePrice: 250.5,
      notes: 'eBay',
    });
  });

  test('accepts a sale price of zero', () => {
    expect(validateRetireForm({ ...base, salePrice: '0' }, today).input?.salePrice).toBe(0);
  });

  test('rejects a negative sale price', () => {
    const result = validateRetireForm({ ...base, salePrice: '-5' }, today);

    expect(result.errors.salePrice).toBe('Enter a price of 0 or more.');
  });

  test('treats the trade value as optional', () => {
    const result = validateRetireForm({ ...base, departureType: 'traded' }, today);

    expect(result.errors).toEqual({});
    expect(result.input).toEqual({ departureType: 'traded', departedOn: '2026-11-01' });
  });

  test('keeps a trade value when one is entered', () => {
    const result = validateRetireForm({ ...base, departureType: 'traded', salePrice: '90' }, today);

    expect(result.input?.salePrice).toBe(90);
  });

  test('drops a leftover price when the type cannot carry one', () => {
    const result = validateRetireForm({ ...base, departureType: 'gifted', salePrice: '90' }, today);

    expect(result.errors).toEqual({});
    expect(result.input).toEqual({ departureType: 'gifted', departedOn: '2026-11-01' });
  });

  test('requires a date and refuses a future one', () => {
    expect(validateRetireForm({ ...base, departedOn: '' }, today).errors.departedOn).toBe(
      'Pick the date it left the vault.',
    );
    expect(
      validateRetireForm({ ...base, departedOn: '2026-11-13', salePrice: '10' }, today).errors
        .departedOn,
    ).toBe('The date cannot be in the future.');
  });

  test('allows today', () => {
    expect(
      validateRetireForm({ ...base, departedOn: today, salePrice: '10' }, today).errors,
    ).toEqual({});
  });
});

describe('departure formatting', () => {
  test('labels every departure type', () => {
    expect(formatDepartureType('sold')).toBe('Sold');
    expect(formatDepartureType('other')).toBe('Other');
  });

  test('formats a date without shifting the day', () => {
    expect(formatDepartureDate('2025-03-01')).toBe('Mar 1, 2025');
    expect(formatDepartureDate(null)).toBe('—');
  });
});
