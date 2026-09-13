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

/**
 * En dashes (\u2013) are deliberately NOT flagged: this codebase uses them for
 * numeric and time ranges ("Showing 1–10 of 12"), which is correct typography
 * rather than the sentence dash this check is about.
 */
export const EM_DASH = "\u2014";

const SCANNED_EXTENSIONS = [".js", ".jsx"];
const SKIPPED_DIRS = new Set(["node_modules", "build", "dist", "coverage"]);

/**
 * Splits one line into the part that is code and the part that is comment.
 *
 * A line comment is only a comment when it is not part of a URL
 * (`https://…`), and a trailing `//` only counts when an even number of quotes
 * precede it, so `"a // b"` is not mistaken for one.
 */
function splitLine(line, inBlockComment) {
  if (inBlockComment) {
    const end = line.indexOf("*/");
    if (end === -1) return { code: "", comment: line, opensBlock: true };
    const rest = line.slice(end + 2);
    return splitLine(rest, false);
  }

  const trimmedAt = line.length - line.trimStart().length;
  const trimmed = line.trimStart();
  if (trimmed.startsWith("//") || trimmed.startsWith("*")) {
    return { code: line.slice(0, trimmedAt), comment: line.slice(trimmedAt), opensBlock: false };
  }

  const blockAt = line.indexOf("/*");
  const lineAt = findLineComment(line);
  if (blockAt !== -1 && (lineAt === -1 || blockAt < lineAt)) {
    const close = line.indexOf("*/", blockAt);
    if (close === -1) {
      return { code: line.slice(0, blockAt), comment: line.slice(blockAt), opensBlock: true };
    }
    const before = line.slice(0, blockAt);
    const after = splitLine(line.slice(close + 2), false);
    return { code: before + after.code, comment: line.slice(blockAt, close + 2) + after.comment, opensBlock: after.opensBlock };
  }
  if (lineAt !== -1) {
    return { code: line.slice(0, lineAt), comment: line.slice(lineAt), opensBlock: false };
  }
  return { code: line, comment: "", opensBlock: false };
}

function findLineComment(line) {
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i] !== "/" || line[i + 1] !== "/") continue;
    if (line[i - 1] === ":") continue; // https:// — part of a URL
    const quotes = (line.slice(0, i).match(/["'`]/g) || []).length;
    if (quotes % 2 === 0) return i;
  }
  return -1;
}

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
    const { code, comment, opensBlock } = splitLine(raw, inBlockComment);
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
