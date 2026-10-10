import { claimPhotoNamespace } from './signupPhotoOwnership';
it('replaces an inherited photo namespace while another tab owns it', async () => {
  const owners = new Set(['original']);
  const locks = { request: async (name, options, callback) => {
    const id = name.replace('signup-photos-', '');
    const lock = owners.has(id) ? null : { name };
    if (lock) owners.add(id);
    return callback(lock);
  } };
  const result = await claimPhotoNamespace('original', locks, () => 'fresh');
  expect(result).toBe('fresh');
});
it('uses a fresh document namespace when ownership coordination is unavailable', async () => {
  expect(await claimPhotoNamespace('inherited', undefined, () => 'fresh')).toBe('fresh');
});
