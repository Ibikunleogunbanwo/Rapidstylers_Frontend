import { ApiClient } from './apiClient';
const request = async (method, path, body) => {
  const response = method === 'get' ? await ApiClient.get(path, { params: body }) : await ApiClient.post(path, body);
  if (String(response.data?.statusCode) !== '200') throw new Error(response.data?.message || 'Unable to complete this request.');
  return response.data.data;
};
export const contentNewsletterApi = {
  get: (path, params) => request('get', path, params),
  post: (path, body) => request('post', path, body),
};
export const requestMessage = error => error?.response?.data?.message || error?.message || 'Unable to reach the server. Try again.';
