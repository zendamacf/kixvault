import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotFound } from './not-found';

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

describe('NotFound', () => {
  test('explains the page is missing and links back to the collection', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Back to collection' }).getAttribute('href')).toBe('/');
  });
});
