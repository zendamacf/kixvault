import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { SneakerThumbnail } from './sneaker-thumbnail';

afterEach(() => {
  cleanup();
});

describe('SneakerThumbnail', () => {
  test('renders a placeholder when no image is available', () => {
    render(<SneakerThumbnail imageUrl={null} alt="Nike Air Max 1" className="h-24 w-24" />);

    expect(screen.getByText('No image')).toBeTruthy();
  });

  test('renders the sneaker image when available', () => {
    render(
      <SneakerThumbnail
        imageUrl="https://images.example.com/sneaker.png"
        alt="Nike Air Max 1"
        className="h-24 w-24"
      />,
    );

    const image = screen.getByRole('img', { name: 'Nike Air Max 1' });
    expect(image.getAttribute('src')).toBe('https://images.example.com/sneaker.png');
  });
});
