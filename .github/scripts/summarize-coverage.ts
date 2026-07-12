const PACKAGE_ORDER = ['shared', 'db', 'api', 'web'] as const;

type PackageFlag = (typeof PACKAGE_ORDER)[number];

type CoverageTotals = {
  linesFound: number;
  linesHit: number;
  funcsFound: number;
  funcsHit: number;
};

type PackageCoverage = CoverageTotals & {
  flag: PackageFlag;
};

function parseLcov(content: string): CoverageTotals {
  const totals: CoverageTotals = {
    linesFound: 0,
    linesHit: 0,
    funcsFound: 0,
    funcsHit: 0,
  };

  for (const line of content.split('\n')) {
    if (line.startsWith('LF:')) totals.linesFound += Number(line.slice(3));
    if (line.startsWith('LH:')) totals.linesHit += Number(line.slice(3));
    if (line.startsWith('FNF:')) totals.funcsFound += Number(line.slice(4));
    if (line.startsWith('FNH:')) totals.funcsHit += Number(line.slice(4));
  }

  return totals;
}

function formatPercent(hit: number, found: number): string {
  if (found === 0) return 'N/A';
  return `${((hit / found) * 100).toFixed(1)}%`;
}

function flagFromArtifactName(name: string): PackageFlag | null {
  const match = name.match(/^coverage-(.+)$/);
  if (!match) return null;
  const flag = match[1] as PackageFlag;
  return PACKAGE_ORDER.includes(flag) ? flag : null;
}

async function findLcovFiles(root: string): Promise<Map<PackageFlag, string>> {
  const files = new Map<PackageFlag, string>();
  const glob = new Bun.Glob('**/lcov.info');

  for await (const path of glob.scan({ cwd: root, onlyFiles: true })) {
    const parts = path.split('/');
    const artifactDir = parts.find((part) => part.startsWith('coverage-'));
    if (!artifactDir) continue;

    const flag = flagFromArtifactName(artifactDir);
    if (!flag) continue;

    files.set(flag, `${root}/${path}`);
  }

  return files;
}

function sumTotals(packages: PackageCoverage[]): CoverageTotals {
  return packages.reduce<CoverageTotals>(
    (combined, pkg) => ({
      linesFound: combined.linesFound + pkg.linesFound,
      linesHit: combined.linesHit + pkg.linesHit,
      funcsFound: combined.funcsFound + pkg.funcsFound,
      funcsHit: combined.funcsHit + pkg.funcsHit,
    }),
    { linesFound: 0, linesHit: 0, funcsFound: 0, funcsHit: 0 },
  );
}

async function main() {
  const root = process.argv[2];
  if (!root) {
    console.error('Usage: bun summarize-coverage.ts <artifacts-directory>');
    process.exit(1);
  }

  const lcovFiles = await findLcovFiles(root);
  const packages: PackageCoverage[] = [];

  for (const flag of PACKAGE_ORDER) {
    const filePath = lcovFiles.get(flag);
    if (!filePath) continue;

    const content = await Bun.file(filePath).text();
    packages.push({ flag, ...parseLcov(content) });
  }

  if (packages.length === 0) {
    console.log('Coverage reports were not available for this workflow run.');
    process.exit(0);
  }

  const combined = sumTotals(packages);
  const rows = packages
    .map(
      (pkg) =>
        `| ${pkg.flag} | ${formatPercent(pkg.linesHit, pkg.linesFound)} | ${formatPercent(pkg.funcsHit, pkg.funcsFound)} |`,
    )
    .join('\n');

  console.log(`## Test coverage

| Package | Lines | Functions |
| --- | --- | --- |
${rows}
| **Combined** | **${formatPercent(combined.linesHit, combined.linesFound)}** | **${formatPercent(combined.funcsHit, combined.funcsFound)}** |

<sub>Updated from commit ${process.env.GITHUB_SHA?.slice(0, 7) ?? 'unknown'}.</sub>`);
}

main();
