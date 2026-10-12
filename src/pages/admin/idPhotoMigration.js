import { useRef, useState } from "react";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { requestError } from "../../hooks/remote/marketplaceApi";
import { AdminCard } from "./adminShell";

/**
 * Owner-only maintenance: move legacy stylist ID photos from public links to
 * private storage (POST /admin/migrate_identification_images). The backend
 * works in pages; each answer carries nextAfterId until the last page (null).
 *
 * "Check" walks every page as a dry run and shows what would move. "Make
 * private" is offered only once a check found photos to move, asks first, then
 * walks the pages for real with a running count, the final totals and every
 * failure with its reason.
 */
const PAGE_SIZE = 100;
/** A safety stop: never loop forever on a backend that keeps answering the same page. */
const MAX_PAGES = 1000;
const COUNTS = ["examined", "found", "migrated", "alreadyPrivate", "failed", "notCloudinary"];

const emptyTotals = () => ({ examined: 0, found: 0, migrated: 0, alreadyPrivate: 0, failed: 0, notCloudinary: 0, failures: [], publicCopyKeptIds: [] });

const addPage = (totals, page) => {
  const next = { ...totals };
  for (const key of COUNTS) next[key] += Number(page?.[key]) || 0;
  next.failures = [...totals.failures, ...(Array.isArray(page?.failures) ? page.failures : [])];
  next.publicCopyKeptIds = [...totals.publicCopyKeptIds, ...(Array.isArray(page?.publicCopyKeptIds) ? page.publicCopyKeptIds : [])];
  return next;
};

const plural = (count, one, many = `${one}s`) => `${Number(count).toLocaleString()} ${count === 1 ? one : many}`;

const IdPhotoMigration = () => {
  // idle | checking | checked | migrating | done
  const [phase, setPhase] = useState("idle");
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState("");
  const running = useRef(false);

  /** Walks every page; each page's running totals go to the screen as they arrive. */
  const runAll = async dryRun => {
    let afterId = null;
    let sum = emptyTotals();
    setTotals(sum);
    for (let pages = 0; pages < MAX_PAGES; pages += 1) {
      const page = await AdminAPI.migrateIdentificationImages({ dryRun, afterId, limit: PAGE_SIZE });
      sum = addPage(sum, page);
      setTotals(sum);
      const next = page?.nextAfterId;
      if (next === null || next === undefined || next === afterId) break;
      afterId = next;
    }
    return sum;
  };

  const check = async () => {
    if (running.current) return;
    running.current = true;
    setError("");
    setPhase("checking");
    try {
      await runAll(true);
      setPhase("checked");
    } catch (failure) {
      setError(requestError(failure));
      setPhase("idle");
    } finally {
      running.current = false;
    }
  };

  const migrate = async () => {
    if (running.current || phase !== "checked" || !(totals?.found > 0)) return;
    if (!window.confirm(`Make ${plural(totals.found, "ID photo")} private? The public copies will be removed. This cannot be undone.`)) return;
    running.current = true;
    setError("");
    setPhase("migrating");
    try {
      await runAll(false);
      setPhase("done");
    } catch (failure) {
      setError(`${requestError(failure)} Photos already moved stay private. Run Check again to see what is left.`);
      setPhase("idle");
    } finally {
      running.current = false;
    }
  };

  const busy = phase === "checking" || phase === "migrating";
  const canMigrate = phase === "checked" && totals?.found > 0;

  return (
    <AdminCard pad="p-4">
      <section aria-labelledby="id-photo-migration-title">
        <h2 id="id-photo-migration-title" className="font-semibold text-gray-900">Make old ID photos private</h2>
        <p className="mt-1 text-sm text-gray-600">
          Older stylist ID photos were stored with public links. This moves them to private storage, where only admins can open them, and removes the public copies.
          Check first to see how many there are; nothing changes until you choose Make private.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" onClick={check} disabled={busy} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">
            {phase === "checking" ? "Checking…" : "Check"}
          </button>
          <button type="button" onClick={migrate} disabled={busy || !canMigrate} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {phase === "migrating" ? "Making private…" : "Make private"}
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div role="status" aria-live="polite" className="mt-3 text-sm text-gray-700">
          {phase === "checking" && totals && <p>Checking… {plural(totals.examined, "stylist")} looked at so far.</p>}
          {phase === "migrating" && totals && <p>Working… {plural(totals.examined, "stylist")} looked at, {plural(totals.migrated, "photo")} made private so far.</p>}
          {phase === "checked" && totals && (
            totals.found > 0
              ? <p>Check finished: {plural(totals.found, "ID photo")} still public out of {plural(totals.examined, "stylist")} looked at.</p>
              : <p>Check finished: no public ID photos left ({plural(totals.examined, "stylist")} looked at).</p>
          )}
          {phase === "done" && totals && <p>Done: {plural(totals.migrated, "photo")} made private.</p>}
        </div>
        {totals && (phase === "checked" || phase === "done") && (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[
              ["Stylists looked at", totals.examined],
              [phase === "done" ? "Found public" : "Still public", totals.found],
              ...(phase === "done" ? [["Made private", totals.migrated]] : []),
              ["Already private", totals.alreadyPrivate],
              ["Stored elsewhere (skipped)", totals.notCloudinary],
              ["Failed", totals.failed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-gray-100 p-2">
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="font-semibold text-gray-900">{Number(value).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        )}
        {totals && totals.failures.length > 0 && (
          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-900">Could not be moved</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
              {totals.failures.map((failure, index) => (
                <li key={`${failure?.stylerId}-${index}`}>Stylist {failure?.stylerId ?? "unknown"}: {failure?.reason || "No reason given"}</li>
              ))}
            </ul>
          </div>
        )}
        {phase === "done" && totals?.publicCopyKeptIds.length > 0 && (
          <p className="mt-3 text-sm text-amber-700">
            {plural(totals.publicCopyKeptIds.length, "photo")} moved to private storage, but the public copy could not be removed (stylist {totals.publicCopyKeptIds.join(", ")}).
          </p>
        )}
      </section>
    </AdminCard>
  );
};

export default IdPhotoMigration;
