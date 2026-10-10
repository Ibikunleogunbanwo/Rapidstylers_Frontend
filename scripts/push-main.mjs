#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const requiredGates = ['bookingReplay', 'schemaValidation', 'stylistProfileUpdates', 'providerWorkflows', 'browserCompatibility'];
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: node scripts/push-main.mjs [--push]\nDefault: verify only. --push: verify, then atomically fast-forward origin/dev and origin/main.\nRun from the repository root on a clean, committed dev branch.');
  process.exit(0);
}
try {
  if (args.some(arg => arg !== '--push') || args.length > 1) throw new Error('Unknown arguments. Use --help.');
  const pushing = args.includes('--push');
  const cwd = process.cwd();
  const run = (command, commandArgs, capture = false) => {
    const result = spawnSync(command, commandArgs, { cwd, env: { ...process.env, BUILD_VERIFY_REQUIRE_PRESENT: "1" }, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
    if (result.error) throw new Error(`${command} is unavailable: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`${command} ${commandArgs.join(' ')} failed. Stop and inspect the remote state before retrying.`);
    return capture ? result.stdout.trim() : '';
  };
  const git = (...gitArgs) => run('git', gitArgs, true);
  if (resolve(git('rev-parse', '--show-toplevel')) !== resolve(cwd)) throw new Error('Run this script from the repository root.');
  if (git('branch', '--show-current') !== 'dev') throw new Error('Switch to dev before running this script.');
  const requireClean = () => {
    if (git('status', '--porcelain')) throw new Error('Working tree must be clean. Review and commit the intended dev changes first; this script never stages files.');
  };
  requireClean();
  const candidate = git('rev-parse', 'HEAD');
  const manifest = JSON.parse(readFileSync(resolve(cwd, 'release-gates.json'), 'utf8'));
  const pending = requiredGates.filter(id => {
    const matches = manifest.gates?.filter(gate => gate.id === id) || [];
    return matches.length !== 1 || matches[0].status !== 'passed' || typeof matches[0].evidence !== 'string' || !matches[0].evidence.trim();
  });
  if (pending.length) throw new Error(`Unresolved release gates: ${pending.join(', ')}. Record verified evidence in release-gates.json before promotion.`);

  console.log(`Verifying dev commit ${candidate}. Mode: ${pushing ? 'publish after checks' : 'check only'}.`);
  // Refresh remote history before checking ancestry. Fetch does not publish changes.
  run('git', ['fetch', 'origin']);
  const remoteRefs = git('for-each-ref', '--format=%(refname)', 'refs/remotes/origin').split('\n');
  if (!remoteRefs.includes('refs/remotes/origin/main')) throw new Error('origin/main is missing; refusing to create main implicitly.');
  const requireAncestor = branch => {
    if (remoteRefs.includes(`refs/remotes/origin/${branch}`)) {
      const result = spawnSync('git', ['merge-base', '--is-ancestor', `refs/remotes/origin/${branch}`, candidate], { cwd, stdio: 'ignore' });
      if (result.status !== 0) throw new Error(`origin/${branch} is not an ancestor of dev. Integrate and verify those changes on dev first. No force push is permitted.`);
    }
  };
  requireAncestor('main');
  requireAncestor('dev');
  for (const [command, commandArgs] of [
    ['npm', ['ci']],
    ['npm', ['audit', '--audit-level=moderate']],
    ['npm', ['test']],
    ['npm', ['run', 'build']],
    [process.execPath, ['scripts/verify-build-chunks.js']],
    ['npx', ['--no-install', 'playwright', 'test']],
  ]) run(command, commandArgs);
  requireClean();
  if (git('rev-parse', 'HEAD') !== candidate || git('branch', '--show-current') !== 'dev') throw new Error('Branch or commit changed during verification. Start again.');
  if (!pushing) {
    console.log(`Checks passed for ${candidate}. Nothing pushed. Use --push when ready to publish.`);
    process.exit(0);
  }
  // Explicit SHA ties publication to the verified commit. Normal push rejects
  // non-fast-forward races; atomic push updates both refs or neither. Never force.
  run('git', ['push', '--atomic', 'origin', `${candidate}:refs/heads/dev`, `${candidate}:refs/heads/main`]);
  console.log(`Published verified commit ${candidate} to origin/dev and origin/main. Local branch remains dev.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
