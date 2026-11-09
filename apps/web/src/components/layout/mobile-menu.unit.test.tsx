import { afterEach, describe, expect, mock, test } from 'bun:test';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

mock.module('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    className,
    ...props
  }: {
    children: ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
}));

const { MobileMenu } = await import('./mobile-menu');

afterEach(() => {
  cleanup();
});

function renderMenu(pathname = '/wears') {
  const client = new QueryClient();

  render(
    <QueryClientProvider client={client}>
      <MobileMenu user={{ id: 'user-1', email: 'collector@example.com' }} pathname={pathname} />
    </QueryClientProvider>,
  );
}

describe('MobileMenu', () => {
  test('is closed until the menu button is pressed', () => {
    renderMenu();

    expect(screen.queryByRole('link', { name: 'Collection' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeTruthy();
  });

  test('lists navigation, activity, colourway, and log out', () => {
    renderMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('link', { name: 'Collection' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Grails' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Wears' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Activity' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Colourway' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(screen.getByText('collector@example.com')).toBeTruthy();
  });

  test('marks the current page', () => {
    renderMenu('/wears');

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('link', { name: 'Wears' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: 'Grails' }).getAttribute('aria-current')).toBeNull();
  });

  test('treats sneaker pages as part of the collection', () => {
    renderMenu('/sneakers/abc');

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('link', { name: 'Collection' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  test('expands the colourway list', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.queryByRole('group', { name: 'Colourway' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Colourway' }));

    const group = screen.getByRole('group', { name: 'Colourway' });
    expect(group.querySelectorAll('button[aria-pressed]').length).toBeGreaterThan(1);
    expect(group.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
  });
});
