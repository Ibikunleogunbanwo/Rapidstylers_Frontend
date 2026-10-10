import { submitRegistration } from './registrationSubmit';

describe('registration commit', () => {
  const files = { profileImageFile: {}, identificationImageFile: {} };
  it('cleans up a successful upload when the other upload fails', async () => {
    const removed = [];
    const create = vi.fn();
    await expect(submitRegistration({ files, payload: {}, upload: async (_, folder) => {
      if (folder === 'id') throw new Error('failed');
      return { url: 'photo', publicId: 'profile' };
    }, remove: async id => removed.push(id), create })).rejects.toThrow('Photo upload failed');
    expect(removed).toEqual(['profile']);
    expect(create).not.toHaveBeenCalled();
  });
  it('preserves uploaded assets when account creation outcome is unknown', async () => {
    const removed = [];
    await expect(submitRegistration({ files, payload: {}, upload: async (_, folder) => ({ url: folder, publicId: folder }),
      remove: async id => removed.push(id), create: async () => { throw new Error('timeout'); }
    })).rejects.toMatchObject({ uncertain: true });
    expect(removed).toEqual([]);
  });
  it('cleans up both assets after an explicit validation rejection', async () => {
    const removed = [];
    const result = await submitRegistration({ files, payload: {}, upload: async (_, folder) => ({ url: folder, publicId: folder }),
      remove: async id => removed.push(id), create: async () => ({ data: { statusCode: '400' } }) });
    expect(result.data.statusCode).toBe('400');
    expect(removed).toEqual(['profile', 'id']);
  });
});

it('marks server errors as uncertain without removing uploaded assets', async () => {
  const removed = [];
  await expect(submitRegistration({ files: {}, payload: {}, upload: async (_, folder) => ({ url: folder, publicId: folder }), remove: async id => removed.push(id), create: async () => ({ data: { statusCode: '500' } }) })).rejects.toMatchObject({ uncertain: true });
  expect(removed).toEqual([]);
});

it('handles interceptor business rejection as definitive failure',async()=>{const remove=vi.fn();const error={response:{status:200,data:{statusCode:'400'}}};await expect(submitRegistration({files:{},payload:{},upload:async(_,folder)=>({url:folder,publicId:folder}),remove,create:async()=>{throw error;}})).rejects.toBe(error);expect(remove).toHaveBeenCalledTimes(2);});

it('classifies upload failures separately from account rejection', async () => {
  await expect(submitRegistration({ files: {}, payload: {}, upload: async () => { throw new Error('private storage internals'); }, remove: async () => {}, create: vi.fn() })).rejects.toMatchObject({ stage: 'upload', message: 'Photo upload failed. Check your connection and try again.' });
});
