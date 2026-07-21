import { describe, expect, mock, test } from 'bun:test';

mock.module('./env', () => ({
  env: {
    maxImageWidth: 1024,
    imageStoragePath: './data/images',
  },
}));

mock.module('./db', () => ({
  db: {},
}));

const { convertImageToWebp } = await import('./image-fetch');

const TRANSPARENT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('convertImageToWebp', () => {
  test('preserves alpha when converting transparent PNGs to WebP', async () => {
    const converted = await convertImageToWebp(TRANSPARENT_PNG);
    const metadata = await import('sharp').then(({ default: sharp }) => sharp(converted).metadata());

    expect(metadata.format).toBe('webp');
    expect(metadata.hasAlpha).toBe(true);
  });
});
