import { afterEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { sessionQueryOptions } from '@/lib/queries';

afterEach(() => {
  cleanup();
});

mock.module('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
  Outlet: () => <div>Outlet</div>,
  useRouterState: () => ({
    location: { pathname: '/grails' },
  }),
}));

describe('AppShell', () => {
  test('shows Collection and Grails navigation for signed-in users', async () => {
    const { AppShell } = await import('./app-shell');
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    client.setQueryData(sessionQueryOptions.queryKey, {
      user: { id: 'user-1', email: 'collector@example.com' },
    });

    render(
      <QueryClientProvider client={client}>
        <AppShell />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Collection' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Grails' })).toBeTruthy();
  });
});
