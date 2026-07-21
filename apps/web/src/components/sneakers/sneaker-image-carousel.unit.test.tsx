import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { SneakerImageCarousel } from './sneaker-image-carousel';

afterEach(() => {
  cleanup();
});

describe('SneakerImageCarousel', () => {
  test('renders a placeholder when no images are available', () => {
    render(<SneakerImageCarousel images={[]} alt="Nike Air Max 1" className="h-24 w-24" />);

    expect(screen.getByText('No image')).toBeTruthy();
  });

  test('renders a single image without carousel controls', () => {
    render(
      <SneakerImageCarousel
        images={[{ url: 'https://images.example.com/sneaker.png' }]}
        alt="Nike Air Max 1"
        className="h-24 w-24"
      />,
    );

    expect(screen.getByRole('img', { name: 'Nike Air Max 1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull();
  });

  test('renders carousel controls for multiple images', () => {
    render(
      <SneakerImageCarousel
        images={[
          { url: 'https://images.example.com/sneaker-1.png' },
          { url: 'https://images.example.com/sneaker-2.png' },
        ]}
        alt="Nike Air Max 1"
        className="h-24 w-24"
      />,
    );

    expect(screen.getByRole('button', { name: 'Next slide' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeTruthy();
  });
});
