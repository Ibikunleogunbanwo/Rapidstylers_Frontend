import { claimPhotoNamespaceOnce } from './signupPhotoOwnership';

/**
 * The lock manager as the engines behave, measured in Chromium and WebKit with
 * locks held for the document's lifetime: a name belongs to whoever first asked
 * for it, an `ifAvailable` request for a held name answers null rather than
 * queueing, and the promise a request answers with is not the promise the
 * callback returns (that one resolves at pagehide, so nothing here waits on it).
 */
const locksManager = () => {
  const held = new Set();
  return {
    held,
    request: (name, options, callback) => {
      if (held.has(name)) return Promise.resolve(callback(null));
      held.add(name);
      return Promise.resolve(callback({ name }));
    },
  };
};

it('claims the name it mints when no other document is holding it', async () => {
  const locks = locksManager();

  expect(await claimPhotoNamespaceOnce({ locks, fresh: () => 'tab-1' })).toBe('tab-1');
});

it('takes back the name a previous document in this tab left behind', async () => {
  // A reload releases the previous document's lock at pagehide, so the stored
  // name is free again — and offering it back is what puts this document in the
  // same database as the photos picked before the reload.
  const locks = locksManager();

  expect(await claimPhotoNamespaceOnce({ locks, preferred: 'stored', fresh: () => 'fresh' })).toBe('stored');
});

it('reports no namespace when another live document is holding one', async () => {
  // A duplicated tab copies sessionStorage along with everything else. It must
  // not be queued behind the tab it came from, nor handed its photos.
  const locks = locksManager();
  locks.held.add('signup-photos-stored');

  expect(await claimPhotoNamespaceOnce({ locks, preferred: 'stored', fresh: () => 'fresh' })).toBeNull();
});

it('keeps to a document name when ownership coordination is unavailable', async () => {
  // No lock manager to police the name, so the minted one is used as it is.
  expect(await claimPhotoNamespaceOnce({ locks: null, fresh: () => 'fresh' })).toBe('fresh');
});

it('inherits the stored name when there is no lock manager to refuse it', async () => {
  expect(await claimPhotoNamespaceOnce({ locks: null, preferred: 'stored', fresh: () => 'fresh' })).toBe('stored');
});
