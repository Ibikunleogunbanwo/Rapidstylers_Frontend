import { vi, describe, it, expect, beforeEach } from 'vitest';
import Axios from 'axios';
import { ApiClient } from './apiClient';
import { contentNewsletterApi } from './contentNewsletterApi';
vi.mock('axios', () => ({ default: { post: vi.fn() } }));
vi.mock('./apiClient', () => ({ ApiClient: { get: vi.fn(), post: vi.fn() } }));
const ok = { data: { statusCode: '200', data: null } };
beforeEach(() => vi.clearAllMocks());
describe('newsletter sign-up target', () => {
  it('the live site posts to its own API', async () => {
    ApiClient.post.mockResolvedValue(ok);
    await contentNewsletterApi.subscribe({ email: 'a@example.com', consent: true }, false);
    expect(ApiClient.post).toHaveBeenCalledWith('/newsletter_subscribe', { email: 'a@example.com', consent: true });
    expect(Axios.post).not.toHaveBeenCalled();
  });
  it('the demo posts to the live API so the address joins the real list', async () => {
    Axios.post.mockResolvedValue(ok);
    await contentNewsletterApi.subscribe({ email: 'a@example.com', consent: true }, true);
    expect(Axios.post.mock.calls[0][0]).toBe('https://api.rapidstylers.ca/rapid_stylers/newsletter_subscribe');
    expect(ApiClient.post).not.toHaveBeenCalled();
  });
  it('shows the server message when the live API refuses', async () => {
    Axios.post.mockResolvedValue({ data: { statusCode: '429', message: 'Too many requests' } });
    await expect(contentNewsletterApi.subscribe({ email: 'a@example.com', consent: true }, true)).rejects.toThrow('Too many requests');
  });
});
