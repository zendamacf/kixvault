import { describe, expect, test } from 'bun:test';
import { isAllowedImageSourceUrl } from './image-source-url';

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
