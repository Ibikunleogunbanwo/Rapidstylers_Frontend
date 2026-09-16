/**
 * Finds em dashes (—) in copy a user can actually read.
 *
 * The site's voice avoids em dashes. One can hide in two places, and only the
 * first matters:
 *
 *   - **code**: string literals and JSX text — the copy that reaches a screen
 *   - **comments**: explanatory prose for whoever reads the source
 *
 * Comments are reported separately so the rule stays about copy and nobody has
 * to rewrite a code comment to pass CI.
 *
 * Used by `src/utils/copyDashes.test.js` (the guard) and runnable directly:
 *
 *     node scripts/find-em-dashes.mjs          # report
 *     node scripts/find-em-dashes.mjs --quiet  # exit code only
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// Code-versus-comment parsing is shared with the unzoned-time guard, so the two
// checks cannot disagree about what counts as copy.
import { splitSourceLine } from "./sourceText.mjs";

/**
 * En dashes (\u2013) are deliberately NOT flagged: this codebase uses them for
 * numeric and time ranges ("Showing 1–10 of 12"), which is correct typography
 * rather than the sentence dash this check is about.
 */
export const EM_DASH = "\u2014";

const SCANNED_EXTENSIONS = [".js", ".jsx"];
const SKIPPED_DIRS = new Set(["node_modules", "build", "dist", "coverage"]);

const hasDash = (text) => text.includes(EM_DASH);

/**
 * Scans one file's text. Returns `{ copy, comments }`, each a list of
 * `{ line, text }` with a 1-based line number.
 */
export function scanText(text) {
  const copy = [];
  const comments = [];
  let inBlockComment = false;

  text.split("\n").forEach((raw, index) => {
    const { code, comment, opensBlock } = splitSourceLine(raw, inBlockComment);
    inBlockComment = opensBlock;
    if (hasDash(code)) copy.push({ line: index + 1, text: raw.trim() });
    else if (hasDash(comment)) comments.push({ line: index + 1, text: raw.trim() });
  });

  return { copy, comments };
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SCANNED_EXTENSIONS.some((ext) => entry.endsWith(ext))) yield full;
  }
}

/** Scans a directory tree, returning `{ file, line, text }` hits for copy. */
export function scanDir(root, { includeTests = true } = {}) {
  const hits = [];
  for (const file of walk(root)) {
    if (!includeTests && file.includes(".test.")) continue;
    const text = readFileSync(file, "utf8");
    if (!hasDash(text)) continue;
    for (const hit of scanText(text).copy) hits.push({ file, ...hit });
  }
  return hits.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src");
  const hits = scanDir(root);
  const quiet = process.argv.includes("--quiet");
  if (!quiet) {
    if (hits.length === 0) {
      console.log("No em dashes in user-facing copy.");
    } else {
      console.log(`${hits.length} em dash(es) in user-facing copy:\n`);
      for (const hit of hits) {
        console.log(`${relative(process.cwd(), hit.file)}:${hit.line}  ${hit.text}`);
      }
    }
  }
  process.exit(hits.length === 0 ? 0 : 1);
}
