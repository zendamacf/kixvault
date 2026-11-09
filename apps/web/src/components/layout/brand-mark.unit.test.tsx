import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render } from '@testing-library/react';
import { BrandMark } from './brand-mark';
import { SNEAKER_EYELETS, SNEAKER_UPPER_PATH } from './sneaker-art';

afterEach(() => {
  cleanup();
});

describe('BrandMark', () => {
  test('is decorative and draws the shared sneaker on an orange tile', () => {
    const { container } = render(<BrandMark />);

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('path')?.getAttribute('d')).toBe(SNEAKER_UPPER_PATH);
    expect(container.querySelector('rect[rx="14"]')).toBeTruthy();
    expect(container.querySelectorAll('circle')).toHaveLength(SNEAKER_EYELETS.length);
  });

  test('draws just the shoe, in the primary colour, when bare', () => {
    const { container } = render(<BrandMark bare />);

    expect(container.querySelector('rect[rx="14"]')).toBeNull();
    expect(container.querySelector('path')?.getAttribute('class')).toContain('fill-primary');
    expect(container.querySelector('path')?.getAttribute('class')).not.toContain(
      'fill-primary-foreground',
    );
    expect(container.querySelectorAll('circle')).toHaveLength(SNEAKER_EYELETS.length);
  });
});
