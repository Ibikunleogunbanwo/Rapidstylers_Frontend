import { isLinkPreviewBot, previewDocument, resolvePreview } from './linkPreview.mjs';

const PAGE_PATH = {
  profile: ({ id, name }) => `/stylistProfile/${encodeURIComponent(id || '')}/${encodeURIComponent(name || '')}`,
  blog: ({ id }) => `/blog/${encodeURIComponent(id || '')}`,
};

/** Reads the rewrite's query from Vercel's parsed `req.query`, or from the URL when that is missing. */
function readQuery(url, query) {
  const params = new URL(url || '/', 'http://localhost').searchParams;
  const pick = (key) => {
    const value = query?.[key] ?? params.get(key);
    return Array.isArray(value) ? value[0] : value == null ? undefined : String(value);
  };
  return { kind: pick('kind'), id: pick('id'), name: pick('name') };
}

/**
 * The function's whole behaviour, independent of Vercel's request object.
 * Bots get the preview document. Anyone else who reaches the function (only
 * possible by calling /api/link-preview directly) is sent to the page itself.
 */
export async function handleLinkPreview({ url, query, userAgent, env = {}, fetchImpl, timeoutMs } = {}) {
  const request = readQuery(url, query);
  if (!isLinkPreviewBot(userAgent)) {
    const path = PAGE_PATH[request.kind]?.(request) || '/';
    return { status: 307, headers: { Location: path, 'Cache-Control': 'no-store' }, body: '' };
  }
  const meta = await resolvePreview(request, { env, ...(fetchImpl ? { fetchImpl } : {}), ...(timeoutMs ? { timeoutMs } : {}) });
  return {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Short browser-side cache only: no s-maxage, so Vercel's CDN never stores a bot answer.
      'Cache-Control': 'public, max-age=300',
      Vary: 'User-Agent',
      ...(meta.noindex ? { 'X-Robots-Tag': 'noindex, nofollow' } : {}),
    },
    body: previewDocument(meta),
  };
}
