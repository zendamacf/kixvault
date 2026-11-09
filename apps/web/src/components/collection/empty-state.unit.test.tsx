import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { EmptyState } from './empty-state';

afterEach(() => {
  cleanup();
});

mock.module('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: { children: ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  createLink: (component: unknown) => component,
}));

describe('EmptyState', () => {
  test('shows the message and a link to the call to action', () => {
    render(
      <EmptyState
        title="Your vault is empty"
        description="Add your first pair."
        actionLabel="Add your first pair"
        actionTo="/sneakers/new"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Your vault is empty' })).toBeTruthy();
    expect(screen.getByText('Add your first pair.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Add your first pair' }).getAttribute('href')).toBe(
      '/sneakers/new',
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('offers a reset when filters hide everything', () => {
    const onClearFilters = mock(() => {});

    render(
      <EmptyState
        title="No matches found"
        description="Try again."
        onClearFilters={onClearFilters}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
