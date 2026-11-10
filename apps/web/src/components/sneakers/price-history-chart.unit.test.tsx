import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PriceHistoryChart, PurchasePriceLine } from './price-history-chart';

afterEach(() => {
  cleanup();
});

describe('PriceHistoryChart', () => {
  test('renders nothing when there is no history', () => {
    const { container } = render(<PriceHistoryChart history={[]} />);

    expect(container.firstChild).toBeNull();
  });

  test('renders an accessible chart for a single snapshot', () => {
    render(
      <PriceHistoryChart history={[{ snapshotDate: '2026-07-20', price: 250, currency: 'USD' }]} />,
    );

    expect(screen.getByRole('img', { name: 'Market price over time' })).toBeTruthy();
  });

  test('does not render a text legend for the purchase price', () => {
    render(
      <PriceHistoryChart
        history={[
          { snapshotDate: '2026-07-20', price: 250, currency: 'USD' },
          { snapshotDate: '2026-07-13', price: 240, currency: 'USD' },
        ]}
        purchasePrice={200}
      />,
    );

    expect(screen.queryByText(/paid/)).toBeNull();
  });
});

describe('PurchasePriceLine', () => {
  test('shows the paid tooltip on hover and hides it on leave', () => {
    render(
      <svg aria-hidden="true">
        <PurchasePriceLine x1={0} x2={300} y1={100} y2={100} purchasePrice={200} />
      </svg>,
    );
    const line = screen.getByTestId('purchase-price-line');

    expect(screen.queryByText('$200 paid', { selector: 'div' })).toBeNull();

    fireEvent.mouseEnter(line);
    expect(screen.getByText('$200 paid', { selector: 'div' })).toBeTruthy();

    fireEvent.mouseLeave(line);
    expect(screen.queryByText('$200 paid', { selector: 'div' })).toBeNull();
  });
});
