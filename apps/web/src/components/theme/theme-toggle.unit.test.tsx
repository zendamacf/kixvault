import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { i18n } from '@/i18n';
import { THEMES } from './themes';

afterEach(() => {
  cleanup();
});

const setTheme = mock((_theme: string) => {});

mock.module('next-themes', () => ({
  useTheme: () => ({ theme: 'bred', setTheme }),
}));

describe('ThemeToggle', () => {
  test('lists every theme, marks the active one and selects another', async () => {
    const { ThemeToggle } = await import('./theme-toggle');
    render(<ThemeToggle />);

    // Radix opens the menu from the keyboard without needing real pointer events.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Change theme' }), { key: 'Enter' });

    const items = await screen.findAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual(
      THEMES.map((theme) => i18n.t(`theme.names.${theme.id}`)),
    );
    expect(screen.getByRole('menuitemradio', { name: 'Bred' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Mocha' }));
    expect(setTheme).toHaveBeenCalledWith('mocha');
  });
});
