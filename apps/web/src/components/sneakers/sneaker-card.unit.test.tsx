import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Sneaker } from '@/lib/queries';
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

const sneaker: Sneaker = {
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
  primaryImage: null,
  catalogSource: null,
  catalogId: null,
  catalogUrl: null,
  releaseDate: null,
  description: null,
  currentMarketPrice: null,
  pricedAt: null,
  gainLoss: null,
  wearCount: 0,
  costPerWear: null,
  lastWornOn: null,
  suggestedCondition: null,
  departureType: null,
  departedOn: null,
  salePrice: null,
  departureNotes: null,
  realizedGainLoss: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
};

describe('SneakerCard', () => {
  test('renders sneaker details', () => {
    render(<SneakerCard sneaker={sneaker} />);

    expect(screen.getByRole('heading').textContent).toBe('Nike Air Max 1');
    expect(screen.getByText('Anniversary Red')).toBeTruthy();
    // Without a market price, what was paid stands in for the value.
    expect(screen.getByText('Paid $180')).toBeTruthy();
    expect(screen.queryByText('Size 10')).toBeNull();
  });

  test('shows the value the list is sorted by', () => {
    const priced = { ...sneaker, currentMarketPrice: 220, gainLoss: 40, wearCount: 3 };
    const { rerender } = render(<SneakerCard sneaker={priced} sortField="wear_count" />);

    expect(screen.getByText('3 wears')).toBeTruthy();

    rerender(<SneakerCard sneaker={priced} sortField="purchase_price" />);
    expect(screen.getByText('Paid $180')).toBeTruthy();

    rerender(<SneakerCard sneaker={priced} sortField="created_at" />);
    expect(screen.getByText(/^Added /)).toBeTruthy();
  });

  test('renders market value when available', () => {
    render(
      <SneakerCard
        sneaker={{
          ...sneaker,
          currentMarketPrice: 220,
          gainLoss: 40,
        }}
      />,
    );

    expect(screen.getByText('$220')).toBeTruthy();
    expect(screen.getByText('+$40')).toBeTruthy();
  });

  test('prefers nickname over colorway in the subtitle', () => {
    render(<SneakerCard sneaker={{ ...sneaker, nickname: 'Patta' }} />);

    expect(screen.getByText('"Patta"')).toBeTruthy();
    expect(screen.queryByText('Anniversary Red')).toBeNull();
  });
});
