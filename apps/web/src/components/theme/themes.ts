export type ThemeMode = 'light' | 'dark';

export type ThemeDefinition = {
  /** Value of the `data-theme` attribute; must match a block in `index.css`. */
  id: string;
  label: string;
  /** Whether the theme has a dark stage. Drives the `dark:` variant and toast styling. */
  mode: ThemeMode;
  /** Preview colours for the picker, drawn as equal bands. Two for two-tone colourways, otherwise three (stage, chrome, accent). */
  swatches: [string, string] | [string, string, string];
};

/** Sneaker colourway themes. Add a matching `[data-theme]` block in `index.css` for each. */
export const THEMES: readonly ThemeDefinition[] = [
  {
    id: 'shattered-backboard',
    label: 'Shattered Backboard',
    mode: 'light',
    swatches: ['hsl(75 6% 91%)', 'hsl(220 14% 8%)', 'hsl(16 100% 58%)'],
  },
  {
    id: 'chicago',
    label: 'Chicago',
    mode: 'light',
    swatches: ['hsl(40 20% 95%)', 'hsl(0 0% 7%)', 'hsl(354 85% 45%)'],
  },
  {
    id: 'unc',
    label: 'UNC',
    mode: 'light',
    swatches: ['hsl(210 30% 95%)', 'hsl(218 50% 12%)', 'hsl(205 80% 62%)'],
  },
  {
    id: 'panda',
    label: 'Panda',
    mode: 'light',
    swatches: ['hsl(0 0% 96%)', 'hsl(0 0% 6%)'],
  },
  {
    id: 'bred',
    label: 'Bred',
    mode: 'dark',
    swatches: ['hsl(0 0% 6%)', 'hsl(354 85% 50%)'],
  },
  {
    id: 'royal',
    label: 'Royal',
    mode: 'dark',
    swatches: ['hsl(226 40% 8%)', 'hsl(226 50% 5%)', 'hsl(222 90% 62%)'],
  },
  {
    id: 'mocha',
    label: 'Mocha',
    mode: 'dark',
    swatches: ['hsl(25 25% 9%)', 'hsl(22 30% 6%)', 'hsl(28 45% 55%)'],
  },
];

export const DEFAULT_THEME = 'shattered-backboard';

export const THEME_IDS = THEMES.map((theme) => theme.id);

/** Light or dark mode of a theme id; unknown ids fall back to light. */
export function themeMode(id: string | undefined): ThemeMode {
  return THEMES.find((theme) => theme.id === id)?.mode ?? 'light';
}
