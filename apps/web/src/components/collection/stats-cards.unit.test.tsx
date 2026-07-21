import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { StatsCards } from './stats-cards';

afterEach(() => {
  cleanup();
});

describe('StatsCards', () => {
  test('renders collection stats', () => {
    render(
      <StatsCards
        count={3}
        totalSpend={540}
        avgSpend={180}
        totalMarketValue={600}
        totalGainLoss={60}
      />,
    );

    expect(screen.getByText('Total pairs')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('$540')).toBeTruthy();
    expect(screen.getByText('$180')).toBeTruthy();
    expect(screen.getByText('$600')).toBeTruthy();
    expect(screen.getByText('+$60')).toBeTruthy();
  });

  test('shows skeletons while loading', () => {
    const { container } = render(<StatsCards isLoading />);

    expect(container.querySelector('[class*="animate-pulse"]')).toBeTruthy();
  });
});
