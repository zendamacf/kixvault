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
    expect(screen.getByRole('img', { name: 'KixVault' })).toBeTruthy();
    expect(screen.getByText('Built for sneaker collectors.')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });

  test('lists what the app does', () => {
    render(
      <AuthLayout>
        <p>Form</p>
      </AuthLayout>,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText(/grails list/)).toBeTruthy();
    expect(screen.getByText(/Chart your collection value/)).toBeTruthy();
  });

  test('lets visitors change the colourway', () => {
    render(
      <AuthLayout>
        <p>Form</p>
      </AuthLayout>,
    );

    expect(screen.getByRole('button', { name: 'Change theme' })).toBeTruthy();
  });
});
