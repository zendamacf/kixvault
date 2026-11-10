/**
 * The KixVault sneaker drawing, used by ShoeSilhouette.
 * public/favicon.svg is a static file and cannot import this, so sneaker-art.unit.test.ts
 * checks that the favicon still contains the same shapes and colours.
 */

/** Low-top upper, drawn in a 64 x 64 grid. */
export const SNEAKER_UPPER_PATH =
  'M10 40v-8c0-2 1-3 3-3.5l8-2 5-9c1-2 3-2.5 5-1.5l4 3c4 4 9 7 15 8 4 1 5 3 5 6v7z';

export const SNEAKER_SOLE = { x: 8, y: 41, width: 48, height: 6, rx: 3 } as const;

export const SNEAKER_EYELETS = [
  { cx: 28, cy: 26 },
  { cx: 33, cy: 29 },
  { cx: 38, cy: 32 },
] as const;

export const SNEAKER_EYELET_RADIUS = 1.4;

/** Off-white sole used where the mark is drawn in fixed colours (header mark and favicon). */
export const SNEAKER_SOLE_COLOR = '#F9F9F7';
