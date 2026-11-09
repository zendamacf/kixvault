import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { ShoeSilhouette } from './shoe-silhouette';
import { SNEAKER_UPPER_PATH } from './sneaker-art';

afterEach(() => {
  cleanup();
});

describe('ShoeSilhouette', () => {
  test('is decorative and uses the shared sneaker drawing', () => {
    const { container } = render(<ShoeSilhouette />);
    const svg = container.querySelector('svg');

    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('path')?.getAttribute('d')).toBe(SNEAKER_UPPER_PATH);
  });
});
