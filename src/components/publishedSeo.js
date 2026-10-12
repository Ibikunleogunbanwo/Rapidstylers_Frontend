import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { contentNewsletterApi as api } from '../hooks/remote/contentNewsletterApi';
import { DEFAULT_IMAGE, PAGE_SEO, SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from '../seo/pageMeta.mjs';

export { SITE_ORIGIN };

// Only visitor-facing content can receive published metadata. A draft must
// never turn a dashboard, login, signup or token-bearing page into an indexable page.
const PUBLIC_PAGES = new Set(Object.keys(PAGE_SEO));

// Each fixed public page gets its own description until an admin publishes one,
// so search results stop showing the same sentence for every page. The same
// copy is baked into build/<route>/index.html for crawlers that do not run
// JavaScript (src/seo/pageMeta.mjs).
export const DEFAULT_DESCRIPTIONS = Object.fromEntries(Object.entries(PAGE_SEO).map(([path, page]) => [path, page.description]));

// The app can boot from a page-specific shell (build/about/index.html carries
// the About page's tags). Navigating away must not keep showing them, so on
// boot the shared tags go back to the site defaults the root shell has, and
// every page then applies its own on top, exactly as when booting from `/`.
const SITE_DEFAULTS = [
  ['name', 'description', SITE_DESCRIPTION],
  ['property', 'og:title', SITE_NAME],
  ['property', 'og:description', SITE_DESCRIPTION],
  ['property', 'og:url', `${SITE_ORIGIN}/`],
  ['property', 'og:image', DEFAULT_IMAGE],
  ['name', 'twitter:title', SITE_NAME],
  ['name', 'twitter:description', SITE_DESCRIPTION],
  ['name', 'twitter:image', DEFAULT_IMAGE],
];

function resetSharedTags() {
  for (const [attribute, name, value] of SITE_DEFAULTS) {
    document.head.querySelector(`meta[${attribute}="${name}"]`)?.setAttribute('content', value);
  }
  document.head.querySelector('link[rel="canonical"]')?.setAttribute('href', `${SITE_ORIGIN}/`);
}

export function isPublicSeoPath(pathname) {
  return PUBLIC_PAGES.has(pathname) || /^\/(?:blog|stylist|stylistProfile)\/.+/.test(pathname);
}

export default function PublishedSeo() {
  const { pathname } = useLocation();
  const [pages, setPages] = useState(null);
  useEffect(resetSharedTags, []);
  useEffect(() => {
    let live = true;
    api.get('/site_seo').then(data => {
      if (live && data && typeof data === 'object' && !Array.isArray(data)) setPages(data);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    const publicPage = isPublicSeoPath(pathname);
    const seo = publicPage ? pages?.[pathname] : null;
    const oldTitle = document.title;
    const changes = [];
    function meta(attribute, name, value) {
      if (!value) return;
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      const existed = Boolean(element);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      const oldContent = element.getAttribute('content');
      element.setAttribute('content', value);
      changes.push(() => {
        if (!existed) element.remove();
        else if (oldContent !== null) element.setAttribute('content', oldContent);
        else element.removeAttribute('content');
      });
    }
    function link(rel, href) {
      const element = document.head.querySelector(`link[rel="${rel}"]`);
      if (!element) return;
      const oldHref = element.getAttribute('href');
      element.setAttribute('href', href);
      changes.push(() => element.setAttribute('href', oldHref));
    }
    if (!publicPage) meta('name', 'robots', 'noindex, nofollow');
    if (publicPage) {
      // Search engines and link previews should point at this page, not the home page.
      const url = SITE_ORIGIN + (pathname === '/' ? '/' : pathname.replace(/\/+$/, ''));
      link('canonical', url);
      meta('property', 'og:url', url);
      const fallback = PAGE_SEO[pathname];
      if (fallback && !seo?.description) {
        meta('name', 'description', fallback.description);
        meta('property', 'og:description', fallback.description);
        meta('name', 'twitter:description', fallback.description);
      }
      if (fallback && !seo?.title) {
        meta('property', 'og:title', fallback.title);
        meta('name', 'twitter:title', fallback.title);
      }
    }
    if (seo) {
      if (typeof seo.title === 'string' && seo.title.trim()) document.title = seo.title;
      meta('name', 'description', seo.description);
      meta('property', 'og:title', seo.title);
      meta('property', 'og:description', seo.description);
      meta('name', 'twitter:title', seo.title);
      meta('name', 'twitter:description', seo.description);
      if (/^https:\/\//.test(seo.ogImageUrl || '')) {
        meta('property', 'og:image', seo.ogImageUrl);
        meta('name', 'twitter:image', seo.ogImageUrl);
      }
      meta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow');
    }
    return () => {
      if (seo?.title && document.title === seo.title) document.title = oldTitle;
      changes.reverse().forEach(undo => undo());
    };
  }, [pathname, pages]);
  return null;
}
