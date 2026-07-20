import { describe, expect, test } from 'bun:test';
import { isValidBarcode, normalizeBarcode } from './barcode';

describe('normalizeBarcode', () => {
  test('accepts a 12-digit UPC', () => {
    expect(normalizeBarcode('197863114996')).toBe('197863114996');
  });

  test('strips non-digit characters', () => {
    expect(normalizeBarcode('1 97863 11499 6')).toBe('197863114996');
  });

  test('accepts a 13-digit EAN', () => {
    expect(normalizeBarcode('0197863114996')).toBe('0197863114996');
  });

  test('rejects invalid lengths', () => {
    expect(normalizeBarcode('12345')).toBeNull();
    expect(normalizeBarcode('')).toBeNull();
  });
});

describe('isValidBarcode', () => {
  test('returns true for valid barcodes', () => {
    expect(isValidBarcode('197863114996')).toBe(true);
  });

  test('returns false for invalid barcodes', () => {
    expect(isValidBarcode('123')).toBe(false);
  });
});
