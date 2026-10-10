/** A live document exclusively owns its photo namespace. A copied sessionStorage
 * ID cannot grant another tab access. Without Web Locks, prefer no reload restore. */
export async function claimPhotoNamespace(id, locks = navigator.locks, fresh = () => crypto.randomUUID()) {
  if (!locks?.request) return fresh();
  const claim = (candidate) => new Promise(resolve => {
    locks.request(`signup-photos-${candidate}`, { ifAvailable: true }, lock => {
      if (!lock) { resolve(false); return; }
      resolve(true);
      return new Promise(release => window.addEventListener('pagehide', release, { once: true }));
    }).catch(() => resolve(false));
  });
  if (await claim(id)) return id;
  const replacement = fresh();
  if (await claim(replacement)) return replacement;
  return fresh();
}
