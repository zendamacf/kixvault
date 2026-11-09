import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { THEMES } from './themes';

afterEach(() => {
  cleanup();
});

const setTheme = mock((_theme: string) => {});

mock.module('next-themes', () => ({
  useTheme: () => ({ theme: 'bred', setTheme }),
}));

// Radix menus need real pointer events to open; render the menu inline instead.
mock.module('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div role="menu" data-value={value} data-change={String(typeof onValueChange)}>
      {children}
    </div>
  ),
  DropdownMenuRadioItem: ({ children, value }: { children: ReactNode; value: string }) => (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={false}
      data-value={value}
      onClick={() => setTheme(value)}
    >
      {children}
    </button>
  ),
}));

describe('ThemeToggle', () => {
  test('lists every theme and selects one', async () => {
    const { ThemeToggle } = await import('./theme-toggle');
    render(<ThemeToggle />);

    expect(screen.getByRole('button', { name: 'Change theme' })).toBeTruthy();
    expect(screen.getByRole('menu').getAttribute('data-value')).toBe('bred');

    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual(THEMES.map((theme) => theme.label));

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Mocha' }));
    expect(setTheme).toHaveBeenCalledWith('mocha');
  });
});
