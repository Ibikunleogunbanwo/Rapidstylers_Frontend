/**
 * Telling a source line's code apart from its comment.
 *
 * Two guards in this repo scan source text for copy a customer would read: the
 * em dash check (`find-em-dashes.mjs`) and the unzoned-time check
 * (`find-unzoned-times.mjs`). Both need the same answer to a fiddly question —
 * is this text rendered, or is it prose for whoever reads the source? — so the
 * answer lives here once rather than being re-implemented per guard and drifting.
 *
 * The subtlety worth keeping in one place: `//` starts a comment only when it is
 * not part of a URL (`https://…`) and not inside a string (`"a // b"`), and a
 * block comment can open and close on the same line, or span several.
 */

/**
 * Splits one line into `{ code, comment, opensBlock }`.
 *
 * `inBlockComment` carries the previous line's state: while inside a block
 * comment everything is comment until the closing marker appears.
 */
export function splitSourceLine(line, inBlockComment) {
  if (inBlockComment) {
    const end = line.indexOf("*/");
    if (end === -1) return { code: "", comment: line, opensBlock: true };
    const rest = line.slice(end + 2);
    return splitSourceLine(rest, false);
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
    const after = splitSourceLine(line.slice(close + 2), false);
    return {
      code: before + after.code,
      comment: line.slice(blockAt, close + 2) + after.comment,
      opensBlock: after.opensBlock,
    };
  }
  if (lineAt !== -1) {
    return { code: line.slice(0, lineAt), comment: line.slice(lineAt), opensBlock: false };
  }
  return { code: line, comment: "", opensBlock: false };
}

/** The index of a real line comment marker on this line, or -1. */
export function findLineComment(line) {
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i] !== "/" || line[i + 1] !== "/") continue;
    if (line[i - 1] === ":") continue; // https:// — part of a URL
    const quotes = (line.slice(0, i).match(/["'`]/g) || []).length;
    if (quotes % 2 === 0) return i;
  }
  return -1;
}

/**
 * Splits a whole file into per-line `{ line, code, comment }` with 1-based line
 * numbers, so a guard can report copy separately from explanation.
 */
export function splitSourceText(text) {
  const rows = [];
  let inBlockComment = false;
  text.split("\n").forEach((raw, index) => {
    const { code, comment, opensBlock } = splitSourceLine(raw, inBlockComment);
    inBlockComment = opensBlock;
    rows.push({ line: index + 1, code, comment, raw });
  });
  return rows;
}
