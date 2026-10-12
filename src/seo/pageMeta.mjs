/**
 * Link-preview and search metadata that has to exist in the HTML a crawler
 * downloads, before any JavaScript runs.
 *
 * Facebook, WhatsApp, iMessage, X, LinkedIn and Slack read the <head> of the
 * first response and never run the app, so tags that PublishedSeo sets in the
 * browser are invisible to them. Two things use this module to put the right
 * tags in that first response:
 *
 *  - the build (vite.config.js) writes build/<route>/index.html for each fixed
 *    public page, a copy of the app shell with that page's tags;
 *  - api/link-preview.mjs answers link-preview bots on stylist profiles and
 *    blog posts with a small document carrying that profile's or post's tags.
 *
 * PublishedSeo uses the same page copy, so the shell, the bot answer and the
 * running app never disagree. Plain ESM with no browser or Vite APIs, so Node
 * (the build and the Vercel function) and Vite (the app) can both import it.
 */

export const SITE_ORIGIN = 'https://www.rapidstylers.ca';
export const SITE_NAME = 'RapidStylers';
export const SITE_DESCRIPTION = 'Find and book trusted beauty professionals near you, from barbers and stylists to nails and lashes.';
// The branded share card (public/og-image.png), shown whenever a page has no
// photo of its own. 1200x630 is the size Facebook, WhatsApp, LinkedIn and X
// show as a full-width card.
export const DEFAULT_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const DEFAULT_IMAGE_WIDTH = 1200;
export const DEFAULT_IMAGE_HEIGHT = 630;
export const DEFAULT_IMAGE_ALT = 'RapidStylers: book trusted beauty professionals near you';

/**
 * The Facebook App ID from REACT_APP_FACEBOOK_APP_ID, or '' when it is unset
 * or not a plain number. Facebook uses fb:app_id to tie shared links to the
 * app for Insights and ads reporting; without it previews still work.
 */
export const facebookAppId = (env = {}) => {
  const id = String(env.REACT_APP_FACEBOOK_APP_ID || '').trim();
  return /^\d{5,20}$/.test(id) ? id : '';
};

/** The fb:app_id tag for `id`, or '' when there is none. */
export const facebookAppIdTag = (id) => (id ? `<meta property="fb:app_id" content="${id}" />` : '');

/**
 * Fixed public pages. Titles match what each page sets as document.title, so
 * a shared link reads the same as the browser tab. `/` is the app shell
 * itself (build/index.html), which already carries the site defaults.
 */
export const PAGE_SEO = {
  '/': { title: SITE_NAME, description: SITE_DESCRIPTION },
  '/search': { title: 'Search | RapidStylers', description: 'Search RapidStylers for hairstylists, barbers, nail technicians, eyelash technicians and makeup artists near you in Canada.' },
  '/elevate-your-looks': { title: 'Gallery | RapidStylers', description: 'Browse recent work by RapidStylers professionals: hair, nails, lashes, makeup and barbering.' },
  '/blog': { title: 'Blog | RapidStylers', description: 'Beauty tips, trends and advice from the RapidStylers team.' },
  '/about': { title: 'About us | RapidStylers', description: 'Why RapidStylers exists and how we connect Canadians with trusted beauty professionals.' },
  '/terms-and-conditions': { title: 'Terms and Conditions | RapidStylers', description: 'The terms that apply when you book or offer services on RapidStylers.' },
  '/privacy-policy': { title: 'Privacy Policy | RapidStylers', description: 'How RapidStylers collects, uses and protects your personal information.' },
  '/faqs': { title: 'FAQs | RapidStylers', description: 'Answers to common questions about booking, payments and joining RapidStylers as a professional.' },
  '/contact-support': { title: 'Support | RapidStylers', description: 'Get help from RapidStylers support by email, phone or support ticket.' },
};

/** Pages that get their own build/<route>/index.html (everything but `/`). */
export const PRERENDERED_ROUTES = Object.keys(PAGE_SEO).filter(path => path !== '/');

/** HTML text and attribute escaping. Every value that reaches markup goes through this. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Collapses whitespace and trims to a search-snippet length on a word boundary. */
export function summarize(text, max = 155) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}

/** Only absolute https images are offered to crawlers; anything else falls back to the share card. */
export const safeImage = (url) => (typeof url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(url.trim()) ? url.trim() : DEFAULT_IMAGE);

/** Absolute URL of a site path, without a trailing slash except for the home page. */
export const canonicalUrl = (path) => SITE_ORIGIN + (path === '/' || !path ? '/' : String(path).replace(/\/+$/, ''));

/** Fills in site defaults for anything a page did not provide. */
export function completeMeta(meta = {}) {
  const title = meta.title || SITE_NAME;
  const description = meta.description || SITE_DESCRIPTION;
  return {
    title,
    description,
    url: meta.url || `${SITE_ORIGIN}/`,
    image: safeImage(meta.image),
    type: meta.type || 'website',
    // Photos and the branded share card are both wide images.
    card: 'summary_large_image',
    fbAppId: meta.fbAppId || '',
    noindex: Boolean(meta.noindex),
  };
}

/** Site defaults for a fixed page, or for the site as a whole when `path` is not one. */
export function pageMeta(path, { noindex = false, fbAppId = '' } = {}) {
  const page = PAGE_SEO[path] || PAGE_SEO['/'];
  return completeMeta({ ...page, url: canonicalUrl(PAGE_SEO[path] ? path : '/'), noindex, fbAppId });
}

/** The <title>, description, canonical, Open Graph and Twitter tags for `meta`, one per line. */
export function headTags(input, indent = '    ') {
  const meta = completeMeta(input);
  const lines = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.url)}" />`,
    `<meta property="og:type" content="${escapeHtml(meta.type)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.url)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    ...(meta.image === DEFAULT_IMAGE ? [
      `<meta property="og:image:width" content="${DEFAULT_IMAGE_WIDTH}" />`,
      `<meta property="og:image:height" content="${DEFAULT_IMAGE_HEIGHT}" />`,
      `<meta property="og:image:alt" content="${escapeHtml(DEFAULT_IMAGE_ALT)}" />`,
    ] : []),
    `<meta property="og:locale" content="en_CA" />`,
    `<meta name="twitter:card" content="${meta.card}" />`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
  ];
  if (meta.fbAppId) lines.push(facebookAppIdTag(meta.fbAppId));
  if (meta.noindex) lines.push('<meta name="robots" content="noindex, nofollow" />');
  return lines.join(`\n${indent}`);
}

// Tags headTags() owns. Each is removed from the shell before the new set goes
// in, so a page never carries two titles or two og:image tags.
const OWNED_TAGS = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name="(?:description|robots|twitter:[\w:]+)"[^>]*>\s*/gi,
  /<meta\s+property="(?:og|fb):[\w:]+"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/gi,
];

/**
 * Returns `html` (the built app shell) with its page metadata replaced by the
 * tags for `meta`. The new tags go where the shell's first metadata tag was;
 * everything else (scripts, styles, icons) is untouched, so the page boots
 * exactly as the shell does.
 */
export function applyHeadTags(html, meta) {
  const head = /<head>([\s\S]*?)<\/head>/i.exec(html);
  if (!head) throw new Error('applyHeadTags: no <head> in the app shell');
  let inner = head[1];
  for (const pattern of OWNED_TAGS) inner = inner.replace(pattern, '\u0000');
  const block = headTags(meta);
  let placed = false;
  inner = inner.replace(/\u0000/g, () => {
    if (placed) return '';
    placed = true;
    return `${block}\n    `;
  });
  if (!placed) inner = `${inner}  ${block}\n  `;
  return html.slice(0, head.index) + `<head>${inner}</head>` + html.slice(head.index + head[0].length);
}

/** Adds fb:app_id to the app shell when an id is set (once; never twice). */
export function addFacebookAppId(html, id) {
  if (!id || /<meta\s+property="fb:app_id"/i.test(html)) return html;
  return html.replace(/<\/head>/i, `  ${facebookAppIdTag(id)}\n  </head>`);
}

/** A noindex robots tag for builds that must stay out of search (the demo). */
export function addNoindex(html) {
  if (/<meta\s+name="robots"/i.test(html)) return html;
  return html.replace(/<\/head>/i, '  <meta name="robots" content="noindex, nofollow" />\n  </head>');
}
