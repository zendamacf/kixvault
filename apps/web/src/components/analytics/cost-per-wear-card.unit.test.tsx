import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { CostPerWearSummary } from '@kixvault/shared';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { CostPerWearCard } from './cost-per-wear-card';

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

const entry = (id: string, name: string, costPerWear: number) => ({
  sneakerId: id,
  name,
  wearCount: 2,
  purchasePrice: costPerWear * 2,
  costPerWear,
});

describe('CostPerWearCard', () => {
  test('shows the average and both lists with cents', () => {
    const summary: CostPerWearSummary = {
      average: 47.5,
      best: [entry('b', 'Jordan 1', 30), entry('a', 'Air Max 1', 100)],
      worst: [entry('a', 'Air Max 1', 100), entry('b', 'Jordan 1', 30)],
    };

    render(<CostPerWearCard summary={summary} />);

    expect(screen.getByText('Average across pairs: $47.50')).toBeTruthy();
    expect(screen.getByText('Best value')).toBeTruthy();
    expect(screen.getByText('Highest cost')).toBeTruthy();
    expect(screen.getAllByText('$30.00')).toHaveLength(2);
  });

  test('hides the highest-cost list when only one pair qualifies', () => {
    const only = entry('a', 'Air Max 1', 25);

    render(<CostPerWearCard summary={{ average: 25, best: [only], worst: [only] }} />);

    expect(screen.queryByText('Highest cost')).toBeNull();
    expect(screen.getAllByText('$25.00')).toHaveLength(1);
  });
});
