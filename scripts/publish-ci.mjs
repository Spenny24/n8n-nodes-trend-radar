import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function emitFailure(title, details) {
  const cleanDetails = details
    .replace(/npm_[A-Za-z0-9]{20,}/g, '[redacted-npm-token]')
    .replace(/\/\/registry\.npmjs\.org\/:_authToken=.*/g, '//registry.npmjs.org/:_authToken=[redacted]');
  const lines = cleanDetails.split('\n');
  const tail = lines.slice(Math.max(0, lines.length - 18)).join('%0A');
  console.error(`::error title=${title}::${tail}`);
}

console.log('Publishing with npm Trusted Publishing / OIDC.');

const publish = run('npm', ['publish', '--provenance', '--access', 'public'], {
  stdio: ['ignore', 'inherit', 'pipe'],
});

if (publish.status !== 0) {
  emitFailure(
    'npm publish failed',
    [
      publish.stderr.trim(),
      '',
      'If npm reports an authentication error, confirm the package Trusted Publisher is configured for GitHub Actions, repository Spenny24/n8n-nodes-trend-radar, workflow publish.yml.',
    ].join('\n'),
  );
  process.exit(publish.status || 1);
}
