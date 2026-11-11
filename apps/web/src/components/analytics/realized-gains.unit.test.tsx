import { afterEach, describe, expect, mock, test } from 'bun:test';
import type { RealizedSummary } from '@kixvault/shared';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RealizedGains } from './realized-gains';

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

const realized: RealizedSummary = {
  totalGainLoss: 20,
  soldCount: 2,
  sales: [
    {
      sneakerId: 'b',
      name: 'Jordan 1',
      departedOn: '2025-05-01',
      salePrice: 150,
      purchasePrice: 200,
      gainLoss: -50,
    },
    {
      sneakerId: 'a',
      name: 'Dunk',
      departedOn: '2025-03-01',
      salePrice: 250,
      purchasePrice: 180,
      gainLoss: 70,
    },
  ],
};

describe('RealizedGains', () => {
  test('shows the total in the gain color and one row per sale', () => {
    render(<RealizedGains realized={realized} />);

    expect(screen.getByText('Up $20').className).toContain('text-gain');
    expect(screen.getByText('+$70').className).toContain('text-gain');
    expect(screen.getByText('-$50').className).toContain('text-loss');
    expect(screen.getByText('Sold May 1, 2025 for $150, paid $200')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  test('shows a net loss in the loss color', () => {
    render(<RealizedGains realized={{ ...realized, totalGainLoss: -35 }} />);

    expect(screen.getByText('Down $35').className).toContain('text-loss');
  });

  test('lists a sale with no purchase price but explains it has no gain', () => {
    render(
      <RealizedGains
        realized={{
          totalGainLoss: null,
          soldCount: 1,
          sales: [
            {
              sneakerId: 'a',
              name: 'Dunk',
              departedOn: '2025-03-01',
              salePrice: 250,
              purchasePrice: null,
              gainLoss: null,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Paid price unknown')).toBeTruthy();
    expect(screen.getByText('Sold Mar 1, 2025 for $250')).toBeTruthy();
    expect(screen.getByText(/no purchase price to compare/)).toBeTruthy();
  });
});
