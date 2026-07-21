import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { PriceHistory } from './price-history';

afterEach(() => {
  cleanup();
});

describe('PriceHistory', () => {
  test('renders snapshot entries', () => {
    render(
      <PriceHistory
        history={[
          { snapshotDate: '2026-07-20', price: 250, currency: 'USD' },
          { snapshotDate: '2026-07-13', price: 240, currency: 'USD' },
        ]}
      />,
    );

    expect(screen.getByText('$250')).toBeTruthy();
    expect(screen.getByText('$240')).toBeTruthy();
  });

  test('shows an empty state when no history exists', () => {
    render(<PriceHistory history={[]} />);

    expect(screen.getByText(/Price history will appear/)).toBeTruthy();
  });
});
