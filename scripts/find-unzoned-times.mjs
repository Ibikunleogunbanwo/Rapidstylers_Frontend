/**
 * Finds clock times in copy that never say whose clock they are on.
 *
 * The platform books appointments at bare wall-clock times in the professional's
 * zone, so a time printed without naming that zone is only correct for a reader
 * standing in the right province. "Confirmed for 4:00 pm" is a different moment
 * in Calgary and in Halifax, and the flow this guard sits next to (the booking
 * confirmation, the calendar entry, the appointment rows) exists precisely to
 * keep those two clocks legible.
 *
 * What counts as a violation: a clock time written into **code** — a string
 * literal or JSX text, the copy a customer actually reads — on a line that
 * carries nothing naming a zone. Comments are ignored, the same way the em dash
 * guard ignores them, because explanation is for whoever reads the source.
 *
 * What deliberately does not count:
 *
 *   - **24-hour values** like "09:00". Forty of them sit in this codebase as the
 *     wire format the availability API speaks, and they are data rather than
 *     copy. Flagging them would bury the real hits, so the rule is the meridiem
 *     form a customer is shown.
 *   - **A time built from variables** (`formatTime12(row.arrivalTime)`). A scan
 *     cannot know whether a zone travels with it, so that case is covered by the
 *     behavioural half of the guard in `src/utils/copyTimezone.test.js`, which
 *     calls the confirmation and calendar copy directly and fails if a time
 *     comes out without a zone.
 *
 * Used by `src/utils/copyTimezone.test.js` (the guard) and runnable directly:
 *
 *     node scripts/find-unzoned-times.mjs          # report
 *     node scripts/find-unzoned-times.mjs --quiet  # exit code only
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { splitSourceText } from "./sourceText.mjs";

/**
 * A clock time as a customer reads it. The meridiem is required: it is what
 * separates rendered copy from the 24-hour values the API exchanges.
 */
export const CLOCK_TIME = /\b\d{1,2}:\d{2}\s?(?:am|pm)\b/i;

/**
 * Anything on the line that names the clock: an identifier carrying the zone, a
 * named Canadian zone, or an IANA id. One of these must be on the line for a
 * time to pass, which is what makes "4:00 pm (Mountain Time)" and
 * `${time} ${zoneLabel}` acceptable while "Confirmed for 4:00 pm" is not.
 */
export const ZONE_CARRIER =
  /timeZone|TimeZone|zoneLabel|ZoneLabel|\bzone\b|\bZone\b|(?:Mountain|Pacific|Eastern|Central|Atlantic|Newfoundland|Saskatchewan|Yukon) Time|\b(?:America|Asia|Europe|Australia|Africa)\/[A-Za-z_]+/;

/**
 * Files allowed to print a time without a zone, each with the reason.
 *
 * Keys are paths from the project root. An entry that stops being needed must be
 * deleted rather than left behind: `scanDir` reports stale exemptions, and the
 * guard fails on them, so this list cannot quietly grow into a way of switching
 * the rule off.
 */
export const EXEMPT_FILES = {
  "src/pages/styler/stylerDashboard.js":
    "opening-hours bands the professional picks for their own weekly calendar " +
    "('6:00-7:00am'). They are that professional's own clock by definition, are " +
    "never shown to a customer, and have no zone to name beyond their own.",
};

const SCANNED_EXTENSIONS = [".js", ".jsx"];
const SKIPPED_DIRS = new Set(["node_modules", "build", "dist", "coverage"]);

/**
 * Scans one file's text, returning the unzoned times in its code as
 * `{ line, text }` with 1-based line numbers.
 */
export function scanText(text) {
  const hits = [];
  for (const row of splitSourceText(text)) {
    if (!CLOCK_TIME.test(row.code)) continue;
    if (ZONE_CARRIER.test(row.code)) continue;
    hits.push({ line: row.line, text: row.raw.trim() });
  }
  return hits;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SCANNED_EXTENSIONS.some((ext) => entry.endsWith(ext))) yield full;
  }
}

const exemptionFor = (file) =>
  Object.keys(EXEMPT_FILES).find((exemptPath) => file.endsWith(exemptPath)) || null;

/**
 * Scans a directory tree.
 *
 * Returns `violations` (code times with no zone and no exemption — the failures),
 * `exempted` (hits in exempt files, kept so a reviewer can see them), and
 * `staleExemptions` (paths exempted that no longer print a bare time, which
 * should be removed).
 */
export function scanDir(root, { includeTests = true } = {}) {
  const violations = [];
  const exempted = [];
  const usedExemptions = new Set();

  for (const file of walk(root)) {
    if (!includeTests && file.includes(".test.")) continue;
    const text = readFileSync(file, "utf8");
    if (!CLOCK_TIME.test(text)) continue;
    const hits = scanText(text);
    if (hits.length === 0) continue;
    const exemptPath = exemptionFor(file);
    for (const hit of hits) {
      if (exemptPath) {
        usedExemptions.add(exemptPath);
        exempted.push({ file, ...hit, reason: EXEMPT_FILES[exemptPath] });
      } else {
        violations.push({ file, ...hit });
      }
    }
  }

  const sort = (a, b) => a.file.localeCompare(b.file) || a.line - b.line;
  return {
    violations: violations.sort(sort),
    exempted: exempted.sort(sort),
    staleExemptions: Object.keys(EXEMPT_FILES).filter((path) => !usedExemptions.has(path)),
  };
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src");
  const { violations, exempted, staleExemptions } = scanDir(root);
  const quiet = process.argv.includes("--quiet");
  if (!quiet) {
    if (violations.length === 0) {
      console.log("Every clock time in customer copy names its zone.");
    } else {
      console.log(`${violations.length} clock time(s) with no zone named:\n`);
      for (const hit of violations) {
        console.log(`${relative(process.cwd(), hit.file)}:${hit.line}  ${hit.text}`);
      }
    }
    for (const hit of exempted) {
      console.log(`\nexempt (${hit.reason})\n  ${relative(process.cwd(), hit.file)}:${hit.line}`);
    }
    for (const path of staleExemptions) {
      console.log(`\nexemption no longer needed, remove it: ${path}`);
    }
  }
  process.exit(violations.length === 0 && staleExemptions.length === 0 ? 0 : 1);
}
