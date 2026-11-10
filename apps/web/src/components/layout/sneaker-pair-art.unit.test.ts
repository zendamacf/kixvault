import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SNEAKER_PAIR_BACK_PATH, SNEAKER_PAIR_FRONT_PATH } from './sneaker-pair-art';

const favicon = readFileSync(
  fileURLToPath(new URL('../../../public/favicon.svg', import.meta.url)),
  'utf8',
);

describe('public/favicon.svg', () => {
  test('draws the same sneaker pair as the in-app logo', () => {
    expect(favicon).toContain(`d="${SNEAKER_PAIR_BACK_PATH}"`);
    expect(favicon).toContain(`d="${SNEAKER_PAIR_FRONT_PATH}"`);
  });
});
