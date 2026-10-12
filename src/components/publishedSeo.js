import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { contentNewsletterApi as api } from '../hooks/remote/contentNewsletterApi';

// Only visitor-facing content can receive published metadata. A draft must
// never turn a dashboard, login, signup or token-bearing page into an indexable page.
const PUBLIC_PAGES = new Set(['/', '/search', '/elevate-your-looks', '/blog', '/about', '/terms-and-conditions', '/privacy-policy', '/faqs', '/contact-support']);
export const SITE_ORIGIN = 'https://www.rapidstylers.ca';

// Each fixed public page gets its own description until an admin publishes one,
// so search results stop showing the same sentence for every page.
export const DEFAULT_DESCRIPTIONS = {
  '/': 'Find and book trusted beauty professionals near you, from barbers and stylists to nails and lashes.',
  '/search': 'Search RapidStylers for hairstylists, barbers, nail technicians, eyelash technicians and makeup artists near you in Canada.',
  '/elevate-your-looks': 'Browse recent work by RapidStylers professionals: hair, nails, lashes, makeup and barbering.',
  '/blog': 'Beauty tips, trends and advice from the RapidStylers team.',
  '/about': 'Why RapidStylers exists and how we connect Canadians with trusted beauty professionals.',
  '/terms-and-conditions': 'The terms that apply when you book or offer services on RapidStylers.',
  '/privacy-policy': 'How RapidStylers collects, uses and protects your personal information.',
  '/faqs': 'Answers to common questions about booking, payments and joining RapidStylers as a professional.',
  '/contact-support': 'Get help from RapidStylers support by email, phone or support ticket.',
};

export function isPublicSeoPath(pathname) {
  return PUBLIC_PAGES.has(pathname) || /^\/(?:blog|stylist|stylistProfile)\/.+/.test(pathname);
}

export default function PublishedSeo() {
  const { pathname } = useLocation();
  const [pages, setPages] = useState(null);
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
      const fallback = DEFAULT_DESCRIPTIONS[pathname];
      if (fallback && !seo?.description) {
        meta('name', 'description', fallback);
        meta('property', 'og:description', fallback);
        meta('name', 'twitter:description', fallback);
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
