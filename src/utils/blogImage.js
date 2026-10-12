import { cloudinaryBlog } from "./cloudinaryImage";

/**
 * Blog images: what a card or article hero actually renders.
 *
 * Older seeded posts (and the offline fallbacks, until they were replaced) point
 * at img.freepik.com: third-party, watermarked and signed with tokens that
 * expire, so they render either someone else's branding or a broken image. Any
 * freepik host, or no image at all, shows our own branded share image instead.
 */
export const BLOG_FALLBACK_IMAGE = "/og-image.png";

/** True when `url` is served from freepik (img.freepik.com or any other freepik host). */
export function isFreepikUrl(url) {
  if (!url) return false;
  try {
    const host = new URL(String(url), "https://rapidstylers.ca").hostname.toLowerCase();
    return /(^|\.)freepik\.[a-z.]+$/.test(host);
  } catch {
    return false;
  }
}

/** `url` unchanged, or the local fallback when it is missing or a freepik hotlink. */
export function safeBlogImage(url, fallback = BLOG_FALLBACK_IMAGE) {
  return !url || isFreepikUrl(url) ? fallback : String(url);
}

/** The src to render for a blog image: Cloudinary-cropped, or the local fallback. */
export function blogImageSrc(url, fallback = BLOG_FALLBACK_IMAGE) {
  const safe = safeBlogImage(url, fallback);
  return safe === fallback ? fallback : cloudinaryBlog(safe);
}
