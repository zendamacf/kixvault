import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SneakerCard } from './sneaker-card';

afterEach(() => {
  cleanup();
});

mock.module('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
  }: {
    children: ReactNode;
    to: string;
    params?: Record<string, string>;
    className?: string;
  }) => (
    <a href="/sneakers/test-id" className={className}>
      {children}
    </a>
  ),
}));

const sneaker = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  brand: 'Nike',
  model: 'Air Max 1',
  colorway: 'Anniversary Red',
  nickname: null,
  size: 10,
  condition: 'deadstock',
  purchasePrice: 180,
  purchaseDate: '2024-06-15',
  notes: null,
  sku: null,
  imageUrl: null,
  catalogSource: null,
  catalogId: null,
  catalogUrl: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

describe('SneakerCard', () => {
  test('renders sneaker details', () => {
    render(<SneakerCard sneaker={sneaker} />);

    expect(screen.getByText('Nike Air Max 1')).toBeTruthy();
    expect(screen.getByText('Anniversary Red · Size 10')).toBeTruthy();
    expect(screen.getByText('Deadstock')).toBeTruthy();
    expect(screen.getByText('Paid $180')).toBeTruthy();
  });

  test('prefers nickname over colorway in the subtitle', () => {
    render(<SneakerCard sneaker={{ ...sneaker, nickname: 'Patta' }} />);

    expect(screen.getByText('"Patta" · Size 10')).toBeTruthy();
  });
});
