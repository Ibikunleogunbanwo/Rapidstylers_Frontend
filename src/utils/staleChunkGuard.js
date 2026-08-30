/**
 * staleChunkGuard.js
 * ------------------
 * Standalone recovery guard for CRA's stale-chunk failures.
 *
 * CRA code-splits routes into content-hashed chunks (static/js/<id>.<hash>).
 * After a redeploy the previous deploy's chunks are gone, so a visitor still
 * running the old shell 404s when a route lazy-loads -> an uncaught
 * ChunkLoadError / "Loading chunk N failed" window error that bricks the page
 * until a manual hard refresh.
 *
 * This module holds ONLY the pure, testable decision logic (classify an error,
 * decide whether to reload, and guard against double/host loops). index.js
 * wires it to the real window/fetch. Keeping it here means the "exactly one
 * reload" and "no infinite loop" guarantees can be unit-tested in isolation.
 */

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/,
  /Loading chunk .* failed/i,
  /Loading CSS chunk/i,
  /loading chunk \w/i,
];

/**
 * True when a window "error" message looks like a webpack chunk-load failure.
 * Anything else (TypeError, ReferenceError, network) is left untouched.
 */
export function isChunkError(message = "") {
  return CHUNK_ERROR_PATTERNS.some((re) => re.test(message));
}

/**
 * Creates a guard that will trigger a reload at most once for the lifetime of
 * the page, so a stream of identical stale-chunk errors can never spin into a
 * reload loop.
 *
 * @param {{ reload?: () => void }} [opts]
 * @returns {{
 *   get attempted(): boolean,
 *   claim(): boolean,
 *   handleError(event): boolean,
 * }}
 *   - claim(): marks the guard as spent WITHOUT reloading (used by the
 *     boot-time manifest check before it calls reload).
 *   - handleError(event): for a chunk error, reloads on the FIRST call and
 *     reports false thereafter.
 */
export function createChunkReloadGuard({ reload } = {}) {
  const reloadFn = typeof reload === "function" ? reload : () => window.location.reload();
  let attempted = false;

  return {
    get attempted() {
      return attempted;
    },

    /**
     * Pre-mark the guard as spent (so a boot-time manifest mismatch and a
     * chunk-load error can't each trigger a reload in the same session).
     * Returns true if this claim succeeded, false if already attempted.
     */
    claim() {
      if (attempted) return false;
      attempted = true;
      return true;
    },

    /**
     * Handle a window error event. Returns true if a reload was (or was
     * already) handled for a chunk error; false for non-chunk errors.
     */
    handleError(event) {
      const msg = event?.message || "";
      if (!isChunkError(msg)) return false;
      if (attempted) return true; // already reloaded; swallow repeats silently
      attempted = true;
      event?.preventDefault?.();
      reloadFn();
      return true;
    },
  };
}