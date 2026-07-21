import { describe, expect, test } from 'bun:test';
import { isAllowedImageSourceUrl, normalizeImageSourceUrl } from './image-source-url';

describe('isAllowedImageSourceUrl', () => {
  test('allows StockX and GOAT image hosts', () => {
    expect(isAllowedImageSourceUrl('https://images.stockx.com/example.png')).toBe(true);
    expect(isAllowedImageSourceUrl('https://image.goat.com/example.png')).toBe(true);
  });

  test('rejects unknown hosts and invalid URLs', () => {
    expect(isAllowedImageSourceUrl('https://evil.example.com/example.png')).toBe(false);
    expect(isAllowedImageSourceUrl('not-a-url')).toBe(false);
  });
});

describe('normalizeImageSourceUrl', () => {
  test('strips StockX background and opaque fit params', () => {
    expect(
      normalizeImageSourceUrl(
        'https://images.stockx.com/images/Air-Jordan-1.jpg?fit=fill&bg=FFFFFF&w=700&fm=webp&trim=color',
      ),
    ).toBe('https://images.stockx.com/images/Air-Jordan-1.jpg?w=700&fm=webp&trim=color');
  });

  test('leaves GOAT URLs unchanged', () => {
    const goatUrl = 'https://image.goat.com/attachments/product_template_pictures/example.png';

    expect(normalizeImageSourceUrl(goatUrl)).toBe(goatUrl);
  });

  test('returns invalid URLs unchanged', () => {
    expect(normalizeImageSourceUrl('not-a-url')).toBe('not-a-url');
  });
});
