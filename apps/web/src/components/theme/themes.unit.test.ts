import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_THEME, THEME_IDS, THEMES } from './themes';

const css = readFileSync(join(import.meta.dir, '../../index.css'), 'utf8');

describe('themes', () => {
  test('ids are unique and include the default', () => {
    expect(new Set(THEME_IDS).size).toBe(THEMES.length);
    expect(THEME_IDS).toContain(DEFAULT_THEME);
  });

  test('every theme has a light and a dark token block with the matching color-scheme', () => {
    for (const theme of THEMES) {
      const light = css.match(
        new RegExp(`(?:^|\\n|, ?)\\[data-theme="${theme.id}"\\]\\s*\\{([^}]*)\\}`),
      )?.[1];
      const dark = css.match(
        new RegExp(`\\.dark\\[data-theme="${theme.id}"\\]\\s*\\{([^}]*)\\}`),
      )?.[1];
      expect(light, `${theme.id} light`).toContain('color-scheme: light;');
      expect(dark, `${theme.id} dark`).toContain('color-scheme: dark;');
    }
  });

  test('the dark variant keys off the dark class', () => {
    expect(css).toMatch(/@custom-variant dark \(&:is\(\.dark \*\)\);/);
  });
});
