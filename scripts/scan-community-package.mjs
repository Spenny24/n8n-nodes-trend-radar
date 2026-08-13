import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'npx',
  ['@n8n/scan-community-package', 'n8n-nodes-trend-radar'],
  { encoding: 'utf8' },
);

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

if (
  result.status !== 0 ||
  output.includes('failed security checks') ||
  output.includes('Analysis failed')
) {
  process.exit(result.status || 1);
}
