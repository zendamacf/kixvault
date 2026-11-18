import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Sneaker } from '@/lib/queries';
import { SneakerTable } from './sneaker-table';

afterEach(() => {
  cleanup();
});

mock.module('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/sneakers/test-id" className={className}>
      {children}
    </a>
  ),
}));

const sneaker = {
  id: '11111111-1111-4111-8111-111111111111',
  brand: 'Nike',
  model: 'Air Max 1',
  colorway: 'Anniversary Red',
  nickname: null,
  size: 10,
  condition: 'deadstock',
  purchasePrice: 180,
  primaryImage: null,
  currentMarketPrice: 220,
  gainLoss: 40,
  wearCount: 4,
  createdAt: '2024-01-01T00:00:00.000Z',
} as Sneaker;

describe('SneakerTable', () => {
  test('renders one row per pair with its figures', () => {
    render(<SneakerTable sneakers={[sneaker]} />);

    expect(screen.getByText('Anniversary Red')).toBeTruthy();
    expect(screen.getByText('Deadstock')).toBeTruthy();
    expect(screen.getByText('$180')).toBeTruthy();
    expect(screen.getByText('$220')).toBeTruthy();
    expect(screen.getByText('+$40')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  test('marks only the sorted column', () => {
    render(<SneakerTable sneakers={[sneaker]} sortField="wear_count" />);

    expect(screen.getByRole('columnheader', { name: 'Wears' }).getAttribute('aria-sort')).toBe(
      'other',
    );
    expect(screen.getByRole('columnheader', { name: 'Paid' }).getAttribute('aria-sort')).toBeNull();
  });

  test('shows a dash when a pair has no market price', () => {
    render(<SneakerTable sneakers={[{ ...sneaker, currentMarketPrice: null, gainLoss: null }]} />);

    expect(screen.getAllByText('—').length).toBe(2);
  });
});
