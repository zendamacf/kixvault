import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { CollectionSummary } from './collection-summary';

afterEach(() => {
  cleanup();
});

describe('CollectionSummary', () => {
  test('reads out spend, market value, and gain', () => {
    render(
      <CollectionSummary
        count={3}
        totalSpend={540}
        avgSpend={180}
        totalMarketValue={600}
        totalGainLoss={60}
      />,
    );

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('$540')).toBeTruthy();
    expect(screen.getByText('$600')).toBeTruthy();
    expect(screen.getByText('$60')).toBeTruthy();
    expect(screen.getByText(/Up/)).toBeTruthy();
    expect(screen.getByText('$180 average per pair')).toBeTruthy();
  });

  test('says down when the collection is under water', () => {
    render(
      <CollectionSummary
        count={1}
        totalSpend={200}
        avgSpend={200}
        totalMarketValue={150}
        totalGainLoss={-50}
      />,
    );

    expect(screen.getByText(/Down/)).toBeTruthy();
    expect(screen.getByText('$50')).toBeTruthy();
    expect(screen.getByRole('region').textContent).toContain('1 pair,');
  });

  test('leaves out market value when no prices are available', () => {
    render(<CollectionSummary count={2} totalSpend={300} avgSpend={150} />);

    expect(screen.getByText('$300')).toBeTruthy();
    expect(screen.queryByText(/worth/)).toBeNull();
    expect(screen.queryByText(/Up|Down/)).toBeNull();
  });

  test('leaves out spend and average when no purchase prices are recorded', () => {
    render(<CollectionSummary count={2} totalSpend={0} avgSpend={0} totalMarketValue={350} />);

    const text = screen.getByRole('region').textContent ?? '';

    expect(text).toContain('2 pairs, worth $350 today.');
    expect(text).not.toContain('bought for');
    expect(screen.queryByText(/average per pair/)).toBeNull();
  });

  test('says break-even when value matches spend', () => {
    render(
      <CollectionSummary
        count={1}
        totalSpend={100}
        avgSpend={100}
        totalMarketValue={100}
        totalGainLoss={0}
      />,
    );

    expect(screen.getByText('Break-even.')).toBeTruthy();
  });

  test('shows skeletons while loading', () => {
    const { container } = render(<CollectionSummary isLoading />);

    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
  });

  test('renders nothing for an empty vault', () => {
    const { container } = render(<CollectionSummary count={0} />);

    expect(container.firstChild).toBeNull();
  });
});
