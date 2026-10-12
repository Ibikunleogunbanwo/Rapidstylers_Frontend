import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { contentNewsletterApi as api } from '../hooks/remote/contentNewsletterApi';

// Only visitor-facing content can receive published metadata. A draft must
// never turn a dashboard, login, signup or token-bearing page into an indexable page.
const PUBLIC_PAGES = new Set(['/', '/search', '/elevate-your-looks', '/blog', '/about', '/terms-and-conditions', '/privacy-policy', '/faqs', '/contact-support']);
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
    if (!publicPage) meta('name', 'robots', 'noindex, nofollow');
    if (seo) {
      if (typeof seo.title === 'string' && seo.title.trim()) document.title = seo.title;
      meta('name', 'description', seo.description);
      meta('property', 'og:title', seo.title);
      meta('property', 'og:description', seo.description);
      if (/^https:\/\//.test(seo.ogImageUrl || '')) meta('property', 'og:image', seo.ogImageUrl);
      meta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow');
    }
    return () => {
      if (seo?.title && document.title === seo.title) document.title = oldTitle;
      changes.reverse().forEach(undo => undo());
    };
  }, [pathname, pages]);
  return null;
}
