import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EM_DASH, scanDir, scanText } from "../../scripts/find-em-dashes.mjs";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const describeHit = (hit) => `${hit.file.replace(SRC + "/", "")}:${hit.line}  ${hit.text}`;

describe("user-facing copy", () => {
  it("never uses an em dash", () => {
    // Test fixtures and test names are not copy a customer reads, so they are
    // out of scope — this is about the strings the app actually renders.
    const hits = scanDir(SRC, { includeTests: false });
    expect(hits.map(describeHit)).toEqual([]);
  });
});

describe("the em dash scanner", () => {
  it("reports copy and ignores comments", () => {
    const source = [
      'const a = "Account created — finish your booking."; // an em dash — in a comment',
      "// a whole line comment — allowed",
      "/* a block comment —",
      "   continued — still allowed */",
      "const url = 'https://example.com/a—b';",
      "const label = <p>Ready — at last</p>;",
      "/** jsdoc — allowed */",
    ].join("\n");

    const { copy, comments } = scanText(source);

    expect(copy.map((hit) => hit.line)).toEqual([1, 5, 6]);
    // Line 1's dash is copy, so its comment is not also reported.
    expect(comments.map((hit) => hit.line)).toEqual([2, 3, 7]);
  });

  it("leaves en dash ranges alone, since they are not sentence dashes", () => {
    const { copy } = scanText('const range = "Showing 1\u201310 of 12";');
    expect(copy).toEqual([]);
  });

  it("would still catch a stray em dash", () => {
    const { copy } = scanText(`const message = "Saved ${EM_DASH} nice.";`);
    expect(copy).toHaveLength(1);
  });
});
