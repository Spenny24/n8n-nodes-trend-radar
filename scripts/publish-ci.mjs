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
  console.error(`::error title=${title}::${cleanDetails.split('\n').slice(0, 10).join('%0A')}`);
}

if (!process.env.NODE_AUTH_TOKEN) {
  emitFailure('Missing npm token', 'NODE_AUTH_TOKEN is empty. Confirm the GitHub Actions secret is named NPM_TOKEN.');
  process.exit(1);
}

const whoami = run('npm', ['whoami']);
if (whoami.status !== 0) {
  emitFailure('npm authentication failed', `${whoami.stdout}\n${whoami.stderr}`.trim());
  process.exit(whoami.status || 1);
}

console.log(`Publishing as npm user: ${whoami.stdout.trim()}`);

const publish = run('npm', ['publish', '--provenance', '--access', 'public'], {
  stdio: ['ignore', 'inherit', 'pipe'],
});

if (publish.status !== 0) {
  emitFailure('npm publish failed', publish.stderr.trim());
  process.exit(publish.status || 1);
}
