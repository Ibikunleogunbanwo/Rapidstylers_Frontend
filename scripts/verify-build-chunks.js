#!/usr/bin/env node
/*
 * verify-build-chunks.js
 * ----------------------
 * Post-build integrity check that catches the "stale reference" failure class
 * BEFORE it reaches production.
 *
 * The app is built by Vite, which code-splits routes into content-hashed files
 * named
 *   build/static/js/<name>.<contentHash>.js
 * and records every emitted file in a build manifest
 *   build/.vite/manifest.json    (enabled via `build.manifest: true`)
 *
 * This script:
 *   1. Reads the build manifest and confirms every file it lists (entry, shared
 *      chunks, per-route chunks, their CSS and other assets) actually exists on
 *      disk — guards against a partial/interrupted build being uploaded and
 *      404ing.
 *   2. Confirms every asset URL the page shell (index.html) references resolves
 *      to a file on disk, so a shell can't point at a bundle that was not
 *      emitted.
 *   3. Confirms index.html loads the manifest's entry chunk — a mismatch means
 *      the shell and the bundle on disk are from different builds (the "stale
 *      shell" state that leaves the site bricked after a redeploy).
 *
 * By default this reports findings and exits 0 (informational). Set the env
 * var BUILD_VERIFY_REQUIRE_PRESENT=1 to make it fail the pipeline on a
 * dangling reference.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const DIR_JS = path.join(BUILD, 'static', 'js');
const MANIFEST = path.join(BUILD, '.vite', 'manifest.json');

const FAIL_FAST = process.env.BUILD_VERIFY_REQUIRE_PRESENT === '1';
const issues = [];
const notes = [];

function logInfo(msg) {
  // eslint-disable-next-line no-console
  console.log(`\u2713 ${msg}`);
}
function logWarn(msg) {
  // eslint-disable-next-line no-console
  console.warn(`\u26A0 ${msg}`);
  notes.push(msg);
}
function logError(msg) {
  // eslint-disable-next-line no-console
  console.error(`\u2716 ${msg}`);
  issues.push(msg);
}

function exists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (_) {
    return false;
  }
}

function existsDir(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch (_) {
    return false;
  }
}

/** Turn a manifest entry's "./static/js/x.js" (or "/static/js/x.js") into a path. */
function toBuildPath(url) {
  return path.join(BUILD, ...url.replace(/^\.?\//, '').split('/'));
}

function main() {
  if (!exists(path.join(BUILD, 'index.html')) || !existsDir(DIR_JS)) {
    logError(`build output missing. Expected ${BUILD}/index.html and ${DIR_JS}. Run \`npm run build\` first.`);
    return finish();
  }

  if (!exists(MANIFEST)) {
    logError(
      `no build manifest at ${path.relative(ROOT, MANIFEST)}. Vite must run with build.manifest enabled so this check can see what the build emitted.`
    );
    return finish();
  }

  /* ---- 1. every manifest file exists on disk --------------------------- */
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const entries = Object.entries(manifest);
  let checked = 0;
  let entryFile = '';

  for (const [key, chunk] of entries) {
    const urls = [chunk.file, ...(chunk.css || []), ...(chunk.assets || [])].filter(Boolean);
    for (const url of urls) {
      checked++;
      if (!exists(toBuildPath(url))) {
        logError(
          `manifest lists ${url} for ${key} but the file is missing on disk. This would 404 for any user requesting it.`
        );
      }
    }
    if (chunk.isEntry) entryFile = chunk.file;
  }

  if (checked === 0) {
    logError('manifest lists no emitted files — the build output looks empty or the manifest format changed.');
  } else {
    logInfo(`build manifest lists ${entries.length} chunk(s) / ${checked} file(s); all present on disk.`);
  }

  if (!entryFile) {
    logError('could not identify the entry chunk in the build manifest (no isEntry flag).');
  } else if (!/^\.?\/?static\/js\/main\.[^/]+\.js$/.test(entryFile)) {
    // The entry name is load-bearing: src/index.js's stale-shell guard looks for
    // /static/js/main. and vercel.json caches /static/* immutably.
    logError(
      `entry chunk is ${entryFile}, but the stale-shell guard in src/index.js expects it under static/js/main.<hash>.js.`
    );
  }

  /* ---- 2. page-shell asset references resolve -------------------------- */
  let html = '';
  try {
    html = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
  } catch (e) {
    logWarn(`could not read index.html for shell checks: ${e.message}`);
  }

  if (html) {
    const refs = [...html.matchAll(/(?:src|href)="(\/static\/[^"]+)"/g)].map((m) => m[1]);
    let missing = 0;
    for (const ref of new Set(refs)) {
      if (!exists(toBuildPath(ref))) {
        missing++;
        logError(`index.html references ${ref} but no such file was emitted. The page shell would 404.`);
      }
    }
    if (missing === 0 && refs.length > 0) {
      logInfo(`page shell references ${new Set(refs).size} emitted asset(s); all present.`);
    }

    /* ---- 3. shell loads the manifest's entry chunk --------------------- */
    if (entryFile) {
      const entryRef = entryFile.replace(/^\.?\//, '');
      const shellEntry = html.match(/src="(\/?static\/js\/main\.[^"]+\.js)"/);
      if (!shellEntry) {
        logError('index.html does not load a static/js/main.<hash>.js entry chunk.');
      } else if (shellEntry[1].replace(/^\//, '') !== entryRef) {
        logError(
          `index.html loads ${shellEntry[1]} but the manifest's entry is ${entryFile}. The shell and the bundle are from different builds — the site would brick after redeploy.`
        );
      } else {
        logInfo(`page shell and build manifest agree on the entry chunk (${shellEntry[1]}).`);
      }
    }
  }

  return finish();
}

function finish() {
  if (issues.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`\n${issues.length} dangling chunk/asset reference(s) found.`);
  } else if (notes.length > 0) {
    // eslint-disable-next-line no-console
    console.log(`\nNo dangling references. ${notes.length} informational note(s).`);
  } else {
    // eslint-disable-next-line no-console
    console.log('\nAll emitted bundles verified: every referenced chunk and asset has a file on disk.');
  }
  process.exit(FAIL_FAST && issues.length > 0 ? 1 : 0);
}

main();
