import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, render, screen } from '@testing-library/react';
import { AuthLayout } from './auth-layout';

afterEach(() => {
  cleanup();
});

describe('AuthLayout', () => {
  test('shows the brand panel next to the page content', () => {
    render(
      <AuthLayout>
        <h1>Welcome back</h1>
      </AuthLayout>,
    );

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.getByText('KixVault')).toBeTruthy();
    expect(screen.getByText('Built for sneaker collectors.')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  test('draws the decorative sneaker without exposing it to screen readers', () => {
    const { container } = render(
      <AuthLayout>
        <p>Form</p>
      </AuthLayout>,
    );

    const decorative = container.querySelectorAll('svg[aria-hidden="true"]');

    expect(decorative.length).toBeGreaterThanOrEqual(2);
  });
});
