import { describe, expect, test } from 'bun:test';
import {
  formatCondition,
  formatCurrency,
  formatDate,
  getCatalogSourceLabel,
  getSneakerBrandColor,
} from './utils';

describe('formatCurrency', () => {
  test('formats USD values without cents', () => {
    expect(formatCurrency(180)).toBe('$180');
  });

  test('returns an em dash for empty values', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });
});

describe('formatCondition', () => {
  test('title-cases underscored condition values', () => {
    expect(formatCondition('lightly_worn')).toBe('Lightly Worn');
  });
});

describe('formatDate', () => {
  test('formats ISO date strings', () => {
    expect(formatDate('2024-06-15')).toMatch(/Jun 15, 2024/);
  });

  test('returns an em dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
  });
});

describe('getCatalogSourceLabel', () => {
  test('maps catalog sources to marketplace labels', () => {
    expect(getCatalogSourceLabel('kicksdb:stockx')).toBe('StockX');
    expect(getCatalogSourceLabel(null)).toBeNull();
  });
});

describe('getSneakerBrandColor', () => {
  test('maps known sneaker brands to theme tokens', () => {
    expect(getSneakerBrandColor('Nike')).toBe('nike');
    expect(getSneakerBrandColor('Air Jordan')).toBe('jordan');
    expect(getSneakerBrandColor('adidas')).toBe('adidas');
    expect(getSneakerBrandColor('Yeezy')).toBe('yeezy');
    expect(getSneakerBrandColor('New Balance')).toBe('new-balance');
    expect(getSneakerBrandColor('ASICS')).toBe('asics');
    expect(getSneakerBrandColor('PUMA')).toBe('puma');
    expect(getSneakerBrandColor('Converse')).toBe('converse');
    expect(getSneakerBrandColor('Vans')).toBe('vans');
    expect(getSneakerBrandColor('Reebok')).toBe('reebok');
    expect(getSneakerBrandColor('Saucony')).toBe('saucony');
    expect(getSneakerBrandColor('Hoka')).toBe('hoka');
    expect(getSneakerBrandColor('Salomon')).toBe('salomon');
    expect(getSneakerBrandColor('On')).toBe('on-running');
    expect(getSneakerBrandColor('Under Armour')).toBe('under-armour');
    expect(getSneakerBrandColor('Brooks')).toBe('brooks');
    expect(getSneakerBrandColor('Fila')).toBe('fila');
  });

  test('prefers more specific brand matches', () => {
    expect(getSneakerBrandColor('adidas Yeezy')).toBe('yeezy');
  });

  test('returns null for unknown brands', () => {
    expect(getSneakerBrandColor('Common Projects')).toBeNull();
  });
});
