import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const [outputPath, ...inputPaths] = process.argv.slice(2);

if (!outputPath || inputPaths.length === 0) {
  console.error('Usage: bun merge-lcov.ts <output> <input...>');
  process.exit(1);
}

const existingPaths = inputPaths.filter(
  (path) => existsSync(path) && readFileSync(path, 'utf8').trim().length > 0,
);

if (existingPaths.length === 0) {
  console.error('No coverage files found to merge.');
  process.exit(1);
}

const merged = existingPaths
  .map((path) => readFileSync(path, 'utf8').trimEnd())
  .filter(Boolean)
  .join('\n');

writeFileSync(outputPath, `${merged}\n`);
