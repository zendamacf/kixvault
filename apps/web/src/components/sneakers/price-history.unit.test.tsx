import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PriceHistory } from './price-history';

afterEach(() => {
  cleanup();
});

describe('PriceHistory', () => {
  test('shows the chart by default and switches to the table', () => {
    render(
      <PriceHistory
        history={[
          { snapshotDate: '2026-07-20', price: 250, currency: 'USD' },
          { snapshotDate: '2026-07-13', price: 240, currency: 'USD' },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Market price over time' })).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Table' }));

    expect(screen.getByText('$250')).toBeTruthy();
    expect(screen.getByText('$240')).toBeTruthy();
    expect(screen.queryByRole('img', { name: 'Market price over time' })).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: 'Chart' }));

    expect(screen.getByRole('img', { name: 'Market price over time' })).toBeTruthy();
  });

  test('shows an empty state when no history exists', () => {
    render(<PriceHistory history={[]} />);

    expect(screen.getByText(/Price history will appear/)).toBeTruthy();
  });
});
