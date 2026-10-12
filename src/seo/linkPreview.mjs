/**
 * What a link-preview bot gets for a stylist profile or a blog post.
 *
 * vercel.json rewrites those URLs to api/link-preview.mjs only when the
 * User-Agent is one of LINK_PREVIEW_BOTS; every other visitor gets the normal
 * app. The function reads the same public endpoints the pages use and answers
 * with a small HTML document that carries only the page's metadata and a link
 * to the real page. No scripts, so the site's CSP is unaffected. Any failure
 * (slow or unreachable API, unknown id, bad response) answers with the site
 * defaults instead of an error, because a preview with the share card beats none.
 */
import { DEFAULT_IMAGE, SITE_NAME, canonicalUrl, completeMeta, escapeHtml, facebookAppId, headTags, safeImage, summarize } from './pageMeta.mjs';

/**
 * User-Agent tokens of the crawlers that build link previews and do not run
 * JavaScript. iMessage identifies as facebookexternalhit + Twitterbot; Teams
 * as SkypeUriPreview. Search engines are deliberately absent: they render the
 * app and must see the same page as a visitor. vercel.json's `has` condition
 * lists the same tokens (a test keeps the two in step).
 */
export const LINK_PREVIEW_BOTS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot', 'Slackbot', 'WhatsApp',
  'TelegramBot', 'Discordbot', 'SkypeUriPreview', 'Pinterestbot', 'redditbot', 'Embedly',
  'vkShare', 'Iframely', 'Mastodon', 'Bluesky', 'Viber', 'Snapchat',
];

const BOT_PATTERN = new RegExp(LINK_PREVIEW_BOTS.map(token => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');

export const isLinkPreviewBot = (userAgent) => BOT_PATTERN.test(String(userAgent || ''));

export const API_TIMEOUT_MS = 2500;

/** Same rule as src/utils/demo.js. */
export const isDemoEnv = (env) => env.REACT_APP_DEMO_MODE === 'true';

/** Profile links carry the id and name base64-encoded (btoa); `+` may arrive as a space from a query string. */
export function decodeSegment(value) {
  try {
    const text = String(value || '').replace(/ /g, '+');
    if (!text || !/^[A-Za-z0-9+/=_-]+$/.test(text)) return '';
    return atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return '';
  }
}

// Keeps a path segment readable (base64 stays as the app writes it) while
// encoding anything that would change the URL's structure.
const encodeSegment = (value) => String(value).replace(/[^A-Za-z0-9\-._~+=!$'()*,;:@]/g, c => encodeURIComponent(c));

/** GETs `${apiBase}${path}` with the website's API key; resolves to `data` of a 200 answer, otherwise throws. */
async function apiGet(path, { apiBase, apiKey, fetchImpl, timeoutMs }) {
  const response = await fetchImpl(`${apiBase.replace(/\/+$/, '')}${path}`, {
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-api-key': apiKey || '' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = await response.json();
  if (String(body?.statusCode) !== '200' || !body.data || typeof body.data !== 'object') throw new Error('Not found');
  return body.data;
}

const BLOG_ID = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * The pages a bot can be rewritten here for. `url` is the page's canonical
 * address (known without the API); `load` reads the page's own data.
 */
const KINDS = {
  profile: {
    url: ({ id, name }) => `${canonicalUrl('/')}stylistProfile/${encodeSegment(id || '')}/${encodeSegment(name || '')}`,
    async load({ id }, api) {
      const stylerId = decodeSegment(id);
      if (!stylerId) throw new Error('Bad profile id');
      const data = await apiGet(`/single_styler?stylerId=${encodeURIComponent(stylerId)}`, api);
      const info = data.stylerInformation || {};
      const business = String(info.businessName || data.businessName || '').trim();
      if (!business) throw new Error('Profile without a name');
      const category = String(info.serviceTypeName || data.serviceTypeName || '').trim();
      const portfolio = Array.isArray(data.stylerPortfolio) ? data.stylerPortfolio : [];
      return {
        title: `${business} | ${SITE_NAME}`,
        description: summarize(info.description)
          || `${business}${category ? `, ${category.toLowerCase()}` : ''} on RapidStylers. See their work and reviews, and book online.`,
        image: [info.profileImageUrl, data.profileImageUrl, info.coverImageUrl, ...portfolio.map(p => p?.imageUrl)]
          .find(url => safeImage(url) !== DEFAULT_IMAGE),
        type: 'profile',
      };
    },
  },
  blog: {
    url: ({ id }) => canonicalUrl(BLOG_ID.test(String(id || '')) ? `/blog/${id}` : '/blog'),
    async load({ id }, api) {
      if (!BLOG_ID.test(String(id || ''))) throw new Error('Bad post id');
      const post = await apiGet(`/single_blog?id=${encodeURIComponent(id)}`, api);
      if (!post.id || !post.title) throw new Error('Post without a title');
      return {
        title: `${String(post.title).trim()} | ${SITE_NAME}`,
        description: summarize(post.content),
        image: post.imageUrl,
        type: 'article',
      };
    },
  },
};

/**
 * Metadata for the page a bot asked for. `query` is the rewrite's query
 * (kind=profile&id=&name= or kind=blog&id=). Never throws: any failure gives
 * the site defaults, still pointing at the requested page.
 */
export async function resolvePreview(query, { env = {}, fetchImpl = globalThis.fetch, timeoutMs = API_TIMEOUT_MS } = {}) {
  const noindex = isDemoEnv(env);
  const fbAppId = facebookAppId(env);
  const kind = KINDS[query?.kind];
  if (!kind) return completeMeta({ noindex, fbAppId });
  const url = kind.url(query);
  try {
    const apiBase = String(env.REACT_APP_API_BASE_URL || '').trim();
    if (!apiBase || typeof fetchImpl !== 'function') throw new Error('No API configured');
    const meta = await kind.load(query, { apiBase, apiKey: env.REACT_APP_API_KEY, fetchImpl, timeoutMs });
    return completeMeta({ ...meta, url, noindex, fbAppId });
  } catch {
    return completeMeta({ url, noindex, fbAppId });
  }
}

/** The whole document a bot receives: metadata plus a plain link to the page. */
export function previewDocument(meta) {
  const full = completeMeta(meta);
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    ${headTags(full)}
  </head>
  <body>
    <h1>${escapeHtml(full.title)}</h1>
    <p>${escapeHtml(full.description)}</p>
    <p><a href="${escapeHtml(full.url)}">${escapeHtml(full.url)}</a></p>
  </body>
</html>
`;
}
