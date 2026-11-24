import { afterEach, describe, expect, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AboutDialog } from './about-dialog';

afterEach(() => {
  cleanup();
});

describe('AboutDialog', () => {
  test('stays closed until the About button is clicked', () => {
    render(<AboutDialog />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('shows the StockX disclaimer when opened', () => {
    render(<AboutDialog />);

    fireEvent.click(screen.getByRole('button', { name: 'About' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(
      screen.getByText(/not affiliated with, endorsed by or sponsored by StockX/),
    ).toBeTruthy();
  });
});
