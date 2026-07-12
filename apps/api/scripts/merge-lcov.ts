import { writeFileSync } from 'node:fs';
import {
  mergeLcovFiles,
  readExistingLcovFiles,
  renderMergedLcov,
} from './coverage-thresholds.ts';

const [outputPath, ...inputPaths] = process.argv.slice(2);

if (!outputPath || inputPaths.length === 0) {
  console.error('Usage: bun merge-lcov.ts <output> <input...>');
  process.exit(1);
}

const contents = readExistingLcovFiles(inputPaths);

if (contents.length === 0) {
  console.error('No coverage files found to merge.');
  process.exit(1);
}

writeFileSync(outputPath, renderMergedLcov(mergeLcovFiles(contents)));
