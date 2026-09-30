import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const biomeConfig = JSON.parse(
  readFileSync(path.join(import.meta.dir, '../../biome.json'), 'utf8'),
) as {
  linter: { rules: { a11y: { noLabelWithoutControl: string } } };
};

describe('Biome a11y configuration', () => {
  test('requires labels to be associated with form controls', () => {
    expect(biomeConfig.linter.rules.a11y.noLabelWithoutControl).toBe('error');
  });
});
