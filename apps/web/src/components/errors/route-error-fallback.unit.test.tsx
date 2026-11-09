import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const captureException = mock(() => {});

mock.module('@sentry/react', () => ({ captureException }));

afterEach(() => {
  cleanup();
  captureException.mockClear();
});

describe('RouteErrorFallback', () => {
  test('reports the error and lets the user retry', async () => {
    const { RouteErrorFallback } = await import('./route-error-fallback');
    const error = new Error('boom');
    const reset = mock(() => {});

    render(<RouteErrorFallback error={error} reset={reset} />);

    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeTruthy();
    expect(captureException).toHaveBeenCalledWith(error);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
