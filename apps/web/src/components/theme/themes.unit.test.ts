import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_THEME, THEME_IDS, THEMES, themeMode } from './themes';

const css = readFileSync(join(import.meta.dir, '../../index.css'), 'utf8');

describe('themes', () => {
  test('ids are unique and include the default', () => {
    expect(new Set(THEME_IDS).size).toBe(THEMES.length);
    expect(THEME_IDS).toContain(DEFAULT_THEME);
  });

  test('themeMode reports the mode and falls back to light', () => {
    expect(themeMode('bred')).toBe('dark');
    expect(themeMode('chicago')).toBe('light');
    expect(themeMode('system')).toBe('light');
    expect(themeMode(undefined)).toBe('light');
  });

  test('every theme has a token block in index.css with the matching color-scheme', () => {
    for (const theme of THEMES) {
      const match = css.match(new RegExp(`\\[data-theme=["']${theme.id}["']\\]\\s*\\{([^}]*)\\}`));
      expect(match, theme.id).toBeTruthy();
      expect(match?.[1]).toContain(`color-scheme: ${theme.mode};`);
    }
  });

  test('the dark variant lists exactly the dark themes', () => {
    const variant = css.match(/@custom-variant dark \(([^;]*)\);/)?.[1] ?? '';
    const listed = [...variant.matchAll(/\[data-theme=["']([^"']+)["']\]/g)].map((m) => m[1]);
    const dark = THEMES.filter((theme) => theme.mode === 'dark').map((theme) => theme.id);
    expect(listed.sort()).toEqual(dark.sort());
  });
});
