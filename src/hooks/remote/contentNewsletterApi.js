import Axios from 'axios';
import { ApiClient } from './apiClient';
import { API_HEADER } from '../../utils/constant';
import { IS_DEMO, LIVE_API_BASE_URL } from '../../utils/demo';
const unwrap = response => {
  if (String(response.data?.statusCode) !== '200') throw new Error(response.data?.message || 'Unable to complete this request.');
  return response.data.data;
};
const request = async (method, path, body) => unwrap(method === 'get' ? await ApiClient.get(path, { params: body }) : await ApiClient.post(path, body));
export const contentNewsletterApi = {
  get: (path, params) => request('get', path, params),
  post: (path, body) => request('post', path, body),
  // The demo's own API is read-only, so the demo sends newsletter sign-ups
  // straight to the live API: they land on the real mailing list.
  subscribe: async (body, demo = IS_DEMO) => demo
    ? unwrap(await Axios.post(`${LIVE_API_BASE_URL}/newsletter_subscribe`, body, { headers: API_HEADER, timeout: 30_000 }))
    : request('post', '/newsletter_subscribe', body),
};
export const requestMessage = error => error?.response?.data?.message || error?.message || 'Unable to reach the server. Try again.';
