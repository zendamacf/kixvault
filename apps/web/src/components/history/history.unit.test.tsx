import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Sneaker } from '@/lib/queries';
import { HistoryRow } from './history-row';
import { HistorySummary, summarizeHistory } from './history-summary';

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

function retiredSneaker(overrides: Partial<Sneaker> = {}): Sneaker {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    userId: 'user-1',
    brand: 'Nike',
    model: 'Dunk Low',
    colorway: 'Panda',
    nickname: null,
    size: 10,
    condition: 'worn',
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
    wearCount: 2,
    lastWornOn: null,
    suggestedCondition: null,
    departureType: 'sold',
    departedOn: '2025-03-01',
    salePrice: 250,
    departureNotes: null,
    realizedGainLoss: 70,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('HistoryRow', () => {
  test('shows how the pair left, the sale price, and a realized gain', () => {
    render(<HistoryRow sneaker={retiredSneaker()} onRestore={() => {}} />);

    expect(screen.getByText('Sold Mar 1, 2025')).toBeTruthy();
    expect(screen.getByText('$250')).toBeTruthy();

    const gain = screen.getByText('+$70');

    expect(gain.className).toContain('text-gain');
  });

  test('shows a realized loss in the loss color', () => {
    render(
      <HistoryRow
        sneaker={retiredSneaker({ salePrice: 150, realizedGainLoss: -30 })}
        onRestore={() => {}}
      />,
    );

    expect(screen.getByText('-$30').className).toContain('text-loss');
  });

  test('shows no price or gain for a gifted pair', () => {
    render(
      <HistoryRow
        sneaker={retiredSneaker({
          departureType: 'gifted',
          salePrice: null,
          realizedGainLoss: null,
        })}
        onRestore={() => {}}
      />,
    );

    expect(screen.getByText('Gifted Mar 1, 2025')).toBeTruthy();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  test('labels a traded value without a gain', () => {
    render(
      <HistoryRow
        sneaker={retiredSneaker({ departureType: 'traded', salePrice: 90, realizedGainLoss: null })}
        onRestore={() => {}}
      />,
    );

    expect(screen.getByText('$90 value')).toBeTruthy();
    expect(screen.queryByText('+$70')).toBeNull();
  });

  test('restores the pair from the row', () => {
    const onRestore = mock(() => {});
    const sneaker = retiredSneaker();
    render(<HistoryRow sneaker={sneaker} onRestore={onRestore} />);

    fireEvent.click(screen.getByRole('button', { name: 'Restore Nike Dunk Low' }));

    expect(onRestore).toHaveBeenCalledWith(sneaker);
  });
});

describe('summarizeHistory', () => {
  test('totals sold pairs and their realized gain', () => {
    const summary = summarizeHistory([
      retiredSneaker(),
      retiredSneaker({ id: 'b', salePrice: 150, realizedGainLoss: -30 }),
      retiredSneaker({ id: 'c', departureType: 'gifted', salePrice: null, realizedGainLoss: null }),
    ]);

    expect(summary).toEqual({ count: 3, soldCount: 2, soldTotal: 400, realizedGainLoss: 40 });
  });

  test('has no realized gain when nothing sold', () => {
    expect(
      summarizeHistory([
        retiredSneaker({ departureType: 'lost', salePrice: null, realizedGainLoss: null }),
      ]),
    ).toEqual({ count: 1, soldCount: 0, soldTotal: 0, realizedGainLoss: null });
  });
});

describe('HistorySummary', () => {
  test('reads as one sentence with the realized gain', () => {
    render(<HistorySummary sneakers={[retiredSneaker(), retiredSneaker({ id: 'b' })]} />);

    expect(screen.getByLabelText('History summary').textContent).toBe(
      '2 pairs have left the vault, 2 sold for $500. Up $140 on what you paid.',
    );
  });

  test('uses the singular for one pair and skips sales when none were sold', () => {
    render(
      <HistorySummary
        sneakers={[
          retiredSneaker({ departureType: 'lost', salePrice: null, realizedGainLoss: null }),
        ]}
      />,
    );

    expect(screen.getByLabelText('History summary').textContent).toBe('1 pair has left the vault.');
  });
});
