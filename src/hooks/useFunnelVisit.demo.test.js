import Axios from 'axios';
import { ApiClient } from './remote/apiClient';
import { recordFunnelVisit } from './useFunnelVisit';
vi.mock('axios',()=>({default:{post:vi.fn()}}));
vi.mock('./remote/apiClient',()=>({ApiClient:{post:vi.fn()}}));
test('a demo visit is counted by the live API, not the read-only demo API',async()=>{
  localStorage.clear();
  vi.spyOn(window.crypto,'randomUUID').mockReturnValue('demo1234-1122-3344-5566-778899aabbcc');
  Axios.post.mockResolvedValue({data:{statusCode:'200'}});
  recordFunnelVisit(true);
  expect(ApiClient.post).not.toHaveBeenCalled();
  expect(Axios.post).toHaveBeenCalledWith('https://api.rapidstylers.ca/rapid_stylers/funnel_visit',{visitorId:'demo1234-1122-3344-5566-778899aabbcc'},expect.any(Object));
  await Promise.resolve();
});
