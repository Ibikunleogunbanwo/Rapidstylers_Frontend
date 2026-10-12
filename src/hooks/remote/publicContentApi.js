import { ApiClient } from "./apiClient";

/**
 * Public page reads that handle their own failures. Unlike APIService, these do
 * not toast: a page that already shows a friendly "not found" must not also show
 * the server's raw message on top of it.
 */
export const fetchBlogPost = (id) => ApiClient.get(`/single_blog?id=${encodeURIComponent(id)}`);

/** True when the server answered (so the article really is missing), false when it was unreachable. */
export const isServerAnswer = (error) => Boolean(error?.response);

/**
 * One page of approved gallery uploads for a backend category: the endpoint the
 * gallery page reads, without its toast, for surfaces (the home page) where the
 * photos are decoration and an outage should just leave them out.
 */
export const fetchGalleryUploads = (category, perPage = 12, page = 1) =>
  ApiClient.get(`/gallery?category=${encodeURIComponent(category)}&per_page=${perPage}&page=${page}`);
