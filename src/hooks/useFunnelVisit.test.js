import { ApiClient } from './remote/apiClient';
import { recordFunnelVisit } from './useFunnelVisit';
vi.mock('./remote/apiClient',()=>({ApiClient:{post:vi.fn()}}));
test('visit beacon sends only anonymous UUID, deduplicates repeated calls and swallows network errors',async()=>{localStorage.clear();vi.spyOn(window.crypto,'randomUUID').mockReturnValue('aabbccdd-1122-3344-5566-778899aabbcc');ApiClient.post.mockRejectedValue(new Error('offline'));recordFunnelVisit();recordFunnelVisit();expect(ApiClient.post).toHaveBeenCalledTimes(1);expect(ApiClient.post).toHaveBeenCalledWith('/funnel_visit',{visitorId:'aabbccdd-1122-3344-5566-778899aabbcc'},expect.objectContaining({skipAuthRefresh:true}));await Promise.resolve();});
