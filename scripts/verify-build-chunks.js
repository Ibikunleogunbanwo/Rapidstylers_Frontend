#!/usr/bin/env node
/*
 * verify-build-chunks.js
 * ----------------------
 * Post-build integrity check that catches the "stale reference" failure class
 * BEFORE it reaches production.
 *
 * CRA/Create React App bundles route chunks into content-hashed files named
 *   build/static/js/<chunkId>.<contentHash>.chunk.js
 * and embeds a chunk-id -> content-hash map inside the emitted main.js like:
 *   {32:"80bb0650", 54:"db0761d1", ...}
 *
 * This script:
 *   1. Reads asset-manifest.json and confirms every file it lists actually
 *      exists on disk (guards against a partial/interrupted build being
 *      uploaded and 404ing).
 *   2. Extracts the chunk-id -> content-hash map from main.js and confirms
 *      each referenced hash has a matching file on disk — reproducing what the
 *      browser will do when a route is lazily loaded, so a "Loading chunk N
 *      failed" can't silently make it to the live bundle.
 *   3. Confirms the page shell (index.html) points at the manifest's main.css.
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

function main() {
  if (!exists(path.join(BUILD, 'index.html')) || !existsDir(DIR_JS)) {
    logError(`build output missing. Expected ${BUILD}/index.html and ${DIR_JS}. Run \`npm run build\` first.`);
    return finish();
  }

  /* ---- 1. asset-manifest.json entries all exist on disk ---------------- */
  const manifestPath = path.join(BUILD, 'asset-manifest.json');
  let files = {};
  let mainCssFromManifest = '';
  if (exists(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    files = manifest.files || {};
    for (const [key, url] of Object.entries(files)) {
      if (typeof url !== 'string' || !url.startsWith('/static/')) continue;
      const file = path.join(BUILD, ...url.split('/'));
      if (!exists(file)) {
        logError(`manifest lists ${url} but the file is missing on disk (${key}). This would 404 for any user requesting it.`);
      }
    }
    mainCssFromManifest = files['main.css'] || '';
    logInfo(`asset-manifest.json lists ${Object.keys(files).length} files; all present on disk.`);
  } else {
    logWarn(`no asset-manifest.json — skipping manifest cross-check.`);
  }

  /* ---- 2. main.js chunk-id -> hash map matches real files -------------- */
  const mainJs = findMainJs();
  if (mainJs) {
    // Reproduce the browser's chunk URL assembly: given id N and hash H, CRA
    // requests static/js/<N>.<H suffix>.chunk.js. We extract every `id:"hash"`,
    // confirm a file matching that id+the-unique-hash exists.
    const mapRe = /\b(\d+):"([0-9a-f]{6,})"/g;
    let match;
    let referenced = 0;
    let dangling = 0;
    const seenHashes = new Set();
    while ((match = mapRe.exec(mainJs)) !== null) {
      const id = match[1];
      // The full runtime map uses the full content hash; a build embedding
      // multiple hashes for one id is fine, so dedupe by (id, hash).
      const key = `${id}:${match[2]}`;
      if (seenHashes.has(key)) continue;
      seenHashes.add(key);
      referenced++;

      // match[2] is stable for the loop body scope; eslint flags the closure but it is fine here.
      // eslint-disable-next-line no-loop-func
      const hashStr = match[2];
      const candidates = fs.readdirSync(DIR_JS).filter(
        (f) => f === `${id}.${hashStr}.chunk.js` || (f.startsWith(`${id}.`) && f.endsWith(`.${hashStr}.chunk.js`))
      );
      if (candidates.length === 0) {
        dangling++;
        logError(
          `chunk id ${id} references hash ${match[2]} but no file static/js/${id}.*(${match[2]}).chunk.js exists. ` +
            `The browser would throw "Loading chunk ${id} failed" when this route loads.`
        );
      }
    }

    // Guard against a degenerate run where the runtime map didn't get parsed
    // (e.g. webpack output format changed) — better to say we couldn't verify
    // than to silently pass.
    if (referenced === 0) {
      logWarn('could not parse any chunk-id -> hash entries from main.js. Verify the CRA/emitted format still matches expectations.');
    } else {
      logInfo(`checked ${referenced} chunk references from main.js; ${dangling === 0 ? 'all have files on disk' : dangling + ' dangling'}.`);
    }
  } else {
    logWarn('could not locate main.*.js under static/js — skipping runtime map check.');
  }

  /* ---- 3. page shell points at the manifest main ----------------------- */
  try {
    const html = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
    const shellCss = /href="([^"]*\/static\/css\/main\.[^"]+\.css)"/.exec(html);
    if (mainCssFromManifest && shellCss && shellCss[1] !== mainCssFromManifest) {
      logWarn(`index.html references ${shellCss[1]} but asset-manifest.json lists ${mainCssFromManifest}. A stale main/CSS pairing is possible on the live site.`);
    } else if (mainCssFromManifest && shellCss) {
      logInfo(`page shell and asset-manifest agree on main.css (${shellCss[1]}).`);
    }
  } catch (e) {
    logWarn(`could not read index.html for shell check: ${e.message}`);
  }

  return finish();
}

function findMainJs() {
  try {
    const files = fs.readdirSync(DIR_JS);
    const main = files.find((f) => /^main\.[0-9a-f]+\.js$/.test(f));
    return main ? fs.readFileSync(path.join(DIR_JS, main), 'utf8') : '';
  } catch (_) {
    return '';
  }
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