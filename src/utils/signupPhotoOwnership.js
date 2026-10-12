/**
 * A live document exclusively owns its photo namespace. A copied sessionStorage
 * ID cannot grant another tab access.
 *
 * The claim is made once per document and the answer is never re-taken. Two
 * facts about Web Locks make re-claiming useless, both measured in the engines
 * the suite runs against (Chromium and WebKit, real navigation, locks held for
 * the document's lifetime the way this module holds them):
 *
 *   - A second `ifAvailable` request for a name this document already holds is
 *     refused outright, and refused again on every later attempt. Web Locks key
 *     by agent, so a document can never win back its own name. Re-asking only
 *     burns the wait, after which a fresh name is minted — and every later call
 *     mints another, so the read and the write land in different databases and
 *     the professional is sent back to the photos step they had just completed.
 *
 *   - Across a real navigation the previous document's lock *is* released at
 *     `pagehide`, and the new document is granted the stored name. That is what
 *     lets a reload find the photos that were picked before it, so the stored
 *     name must be offered rather than replaced.
 *
 * A refusal therefore means exactly one thing: a different live document is
 * holding that name, which for a duplicated tab is the copied sessionStorage ID
 * arriving with everything else. The caller keeps to a name of its own instead.
 *
 * @param {object} [options]
 * @param {string} [options.preferred] The name a previous document in this tab
 *   was granted, offered back so a reload lands in the same database.
 * @param {LockManager} [options.locks] Injected for tests.
 * @param {() => string} [options.fresh] Mints a new name when none is held.
 * @returns {Promise<string|null>} The name this document now owns, or null when
 *   another live document holds it.
 */
export function claimPhotoNamespaceOnce({
  preferred = null,
  locks = navigator.locks,
  fresh = () => crypto.randomUUID(),
} = {}) {
  const name = preferred || fresh();
  if (!locks?.request) return Promise.resolve(name);

  return new Promise(resolve => {
    // `ifAvailable`, so a name another tab is holding is refused rather than
    // queued behind it: a copied sessionStorage ID must not gain access.
    locks.request(`signup-photos-${name}`, { ifAvailable: true }, lock => {
      resolve(lock ? name : null);
      // Released on the way out, so the next document in this tab inherits the
      // name instead of meeting a lock nobody alive still holds.
      return new Promise(release => window.addEventListener("pagehide", release, { once: true }));
    }).catch(() => resolve(null));
  });
}
