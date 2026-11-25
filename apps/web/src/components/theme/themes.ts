/** Light or dark appearance. Independent of the colorway: every colorway has both. */
export type ThemeMode = 'light' | 'dark';

/** What the user picks: a fixed mode, or follow the operating system. */
export type ModePreference = ThemeMode | 'system';

export type ThemeDefinition = {
  /** Value of the `data-theme` attribute; must match light and dark token blocks in `index.css`. */
  id: string;
};

/** Sneaker colorways. Add a `[data-theme]` block and a `.dark[data-theme]` block in `index.css` for each. */
export const THEMES: readonly ThemeDefinition[] = [
  { id: 'shattered-backboard' },
  { id: 'chicago' },
  { id: 'unc' },
  { id: 'panda' },
  { id: 'pine-green' },
  { id: 'court-purple' },
  { id: 'infrared' },
  { id: 'bred' },
  { id: 'royal' },
  { id: 'mocha' },
  { id: 'thunder' },
];

export const DEFAULT_THEME = 'shattered-backboard';

export const THEME_IDS = THEMES.map((theme) => theme.id);

export const MODE_PREFERENCES: readonly ModePreference[] = ['system', 'light', 'dark'];
