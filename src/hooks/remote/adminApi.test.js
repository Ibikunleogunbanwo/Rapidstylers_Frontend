import { AdminAPI } from './adminApi';
import { ApiClient } from './apiClient';

vi.mock('./apiClient', () => ({ ApiClient: { get: vi.fn(), post: vi.fn() } }));

const ok = data => ({ data: { statusCode: '200', data } });
beforeEach(() => { vi.clearAllMocks(); });

it('counts the audience an announcement will reach', async () => {
  ApiClient.get.mockResolvedValue(ok({ count: 87 }));
  expect(await AdminAPI.announcementAudienceCount('STYLISTS')).toEqual({ count: 87 });
  expect(ApiClient.get).toHaveBeenLastCalledWith('/admin/announcement_audience_count', { params: { audience: 'STYLISTS' } });
});

it('runs one page of the ID photo move, sending afterId only when there is one', async () => {
  ApiClient.post.mockResolvedValue(ok({ examined: 3, nextAfterId: null }));
  expect(await AdminAPI.migrateIdentificationImages({ dryRun: true, afterId: null, limit: 100 })).toEqual({ examined: 3, nextAfterId: null });
  expect(ApiClient.post).toHaveBeenLastCalledWith('/admin/migrate_identification_images', { dryRun: true, limit: 100 });
  await AdminAPI.migrateIdentificationImages({ dryRun: false, afterId: 120, limit: 100 });
  expect(ApiClient.post).toHaveBeenLastCalledWith('/admin/migrate_identification_images', { dryRun: false, afterId: 120, limit: 100 });
  await AdminAPI.migrateIdentificationImages();
  expect(ApiClient.post).toHaveBeenLastCalledWith('/admin/migrate_identification_images', { dryRun: true });
});

it('rejects with the backend message when a page is refused', async () => {
  ApiClient.post.mockResolvedValue({ data: { statusCode: '403', message: 'Owners only' } });
  await expect(AdminAPI.migrateIdentificationImages({ dryRun: true })).rejects.toThrow('Owners only');
});
