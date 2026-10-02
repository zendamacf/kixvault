import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { WishlistCard } from './wishlist-card';

afterEach(() => {
  cleanup();
});

mock.module('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a href="/grails/test-id" className={className}>
      {children}
    </a>
  ),
}));

describe('WishlistCard', () => {
  test('renders grail details and priority', () => {
    render(
      <WishlistCard
        item={{
          id: '11111111-1111-4111-8111-111111111111',
          userId: 'user-1',
          brand: 'Nike',
          model: 'Dunk Low',
          colorway: 'Panda',
          priority: 'high',
          notes: 'Need these',
          sku: null,
          catalogSource: null,
          catalogId: null,
          catalogUrl: null,
          nickname: null,
          releaseDate: null,
          description: null,
          imageUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        }}
      />,
    );

    expect(screen.getByText('Nike Dunk Low')).toBeTruthy();
    expect(screen.getByText('High priority')).toBeTruthy();
    expect(screen.getByText('Need these')).toBeTruthy();
  });
});
