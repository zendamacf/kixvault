import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  SNEAKER_EYELET_RADIUS,
  SNEAKER_EYELETS,
  SNEAKER_SOLE,
  SNEAKER_SOLE_COLOR,
  SNEAKER_UPPER_PATH,
} from './sneaker-art';

const favicon = readFileSync(
  fileURLToPath(new URL('../../../public/favicon.svg', import.meta.url)),
  'utf8',
);

describe('public/favicon.svg', () => {
  test('draws the same sneaker as the in-app mark', () => {
    expect(favicon).toContain(`d="${SNEAKER_UPPER_PATH}"`);
  });

  test('uses the same sole', () => {
    const { x, y, width, height, rx } = SNEAKER_SOLE;

    expect(favicon).toContain(`x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}"`);
    expect(favicon).toContain(`fill="${SNEAKER_SOLE_COLOR}"`);
  });

  test('uses the same eyelets', () => {
    for (const { cx, cy } of SNEAKER_EYELETS) {
      expect(favicon).toContain(`cx="${cx}" cy="${cy}" r="${SNEAKER_EYELET_RADIUS}"`);
    }
  });
});
