import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { i18n } from '@/i18n';
import { ModeProvider } from './mode';
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
    render(
      <ModeProvider>
        <ThemeToggle />
      </ModeProvider>,
    );

    // Radix opens the menu from the keyboard without needing real pointer events.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Change theme' }), { key: 'Enter' });

    await screen.findAllByRole('menuitemradio');
    const names = THEMES.map((theme) => i18n.t(`theme.names.${theme.id}`));
    for (const name of names) {
      expect(screen.getByRole('menuitemradio', { name })).toBeTruthy();
    }
    expect(screen.getByRole('menuitemradio', { name: 'System' }).getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Bred' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Mocha' }));
    expect(setTheme).toHaveBeenCalledWith('mocha');

    fireEvent.keyDown(screen.getByRole('button', { name: 'Change theme' }), { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitemradio', { name: 'Dark' }));
    expect(localStorage.getItem('kixvault-mode')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
