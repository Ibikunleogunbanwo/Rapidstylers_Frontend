// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { DEFAULT_IMAGE, PAGE_SEO, PRERENDERED_ROUTES, addFacebookAppId, addNoindex, applyHeadTags, escapeHtml, facebookAppId, headTags, pageMeta, summarize } from './pageMeta.mjs';

const repo = resolve(__dirname, '../..');
const read = (path) => readFileSync(resolve(repo, path), 'utf8');
const shell = read('index.html');
const count = (html, pattern) => (html.match(pattern) || []).length;
const attr = (html, selector) => new RegExp(`<meta ${selector} content="([^"]*)"`).exec(html)?.[1];

describe('escapeHtml', () => {
  it('escapes everything that could leave an attribute or open a tag', () => {
    expect(escapeHtml(`Ana's "Hair" <b>&</b>`)).toBe('Ana&#39;s &quot;Hair&quot; &lt;b&gt;&amp;&lt;/b&gt;');
    expect(escapeHtml(null)).toBe('');
  });
});

describe('summarize', () => {
  it('collapses whitespace and cuts long text on a word boundary', () => {
    expect(summarize('  a\n\n b  ')).toBe('a b');
    const long = summarize('word '.repeat(80));
    expect(long.length).toBeLessThanOrEqual(155);
    expect(long.endsWith('word…')).toBe(true);
  });
});

describe('default share image', () => {
  it('is the branded card in public/, with its size in every page head', () => {
    expect(DEFAULT_IMAGE).toBe('https://www.rapidstylers.ca/og-image.png?v=20261012');
    expect(existsSync(resolve(repo, 'public/og-image.png'))).toBe(true);
    const png = readFileSync(resolve(repo, 'public/og-image.png'));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(attr(shell, 'property="og:image"')).toBe(DEFAULT_IMAGE);
    expect(attr(shell, 'name="twitter:image"')).toBe(DEFAULT_IMAGE);
    const html = applyHeadTags(shell, pageMeta('/about'));
    expect(count(html, /property="og:image:width"/g)).toBe(1);
    expect(attr(html, 'property="og:image:height"')).toBe('630');
    expect(headTags({ image: 'https://img.example/a.png' })).not.toContain('og:image:width');
  });
});

describe('Facebook App ID', () => {
  it('only accepts a plain numeric id', () => {
    expect(facebookAppId({ REACT_APP_FACEBOOK_APP_ID: ' 1234567890 ' })).toBe('1234567890');
    for (const bad of [undefined, '', 'abc', '12"><script>', '123']) expect(facebookAppId({ REACT_APP_FACEBOOK_APP_ID: bad })).toBe('');
  });

  it('is absent when unset and appears once in every shell when set', () => {
    expect(shell).not.toContain('fb:app_id');
    expect(headTags(pageMeta('/faqs'))).not.toContain('fb:app_id');
    const root = addFacebookAppId(shell, '1234567890');
    expect(addFacebookAppId(root, '1234567890')).toBe(root);
    expect(addFacebookAppId(shell, '')).toBe(shell);
    const page = applyHeadTags(root, pageMeta('/faqs', { fbAppId: '1234567890' }));
    expect(count(page, /property="fb:app_id"/g)).toBe(1);
    expect(attr(page, 'property="fb:app_id"')).toBe('1234567890');
  });
});

describe('applyHeadTags', () => {
  it('gives a page its own tags and keeps exactly one of each', () => {
    const html = applyHeadTags(shell, pageMeta('/faqs'));
    expect(count(html, /<title>/g)).toBe(1);
    expect(html).toContain('<title>FAQs | RapidStylers</title>');
    for (const tag of ['name="description"', 'property="og:title"', 'property="og:description"', 'property="og:url"', 'property="og:image"', 'property="og:type"', 'property="og:site_name"', 'name="twitter:card"', 'name="twitter:title"', 'name="twitter:description"', 'name="twitter:image"']) {
      expect(count(html, new RegExp(`<meta\\s+${tag}`, 'g'))).toBe(1);
    }
    expect(count(html, /rel="canonical"/g)).toBe(1);
    expect(html).toContain('<link rel="canonical" href="https://www.rapidstylers.ca/faqs" />');
    expect(attr(html, 'property="og:url"')).toBe('https://www.rapidstylers.ca/faqs');
    expect(attr(html, 'name="description"')).toBe(PAGE_SEO['/faqs'].description);
    expect(attr(html, 'name="twitter:title"')).toBe('FAQs | RapidStylers');
    expect(html).not.toContain('name="robots"');
  });

  it('leaves everything that boots the app untouched', () => {
    const strip = (html) => html.replace(/<title>[\s\S]*?<\/title>|<meta\s+(?:name|property)="(?:description|og:[\w:]+|twitter:[\w:]+)"[^>]*>|<link\s+rel="canonical"[^>]*>|\s+/g, '');
    expect(strip(applyHeadTags(shell, pageMeta('/about')))).toBe(strip(shell));
    expect(applyHeadTags(shell, pageMeta('/about'))).toContain('<script type="module" src="/src/index.js"></script>');
  });

  it('escapes every value it writes', () => {
    const html = applyHeadTags(shell, { title: `"><script>alert(1)</script>`, description: `a & b's`, url: 'https://www.rapidstylers.ca/x?a=1&b="2"', image: 'https://img.example/a.png' });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('<title>&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>');
    expect(attr(html, 'name="description"')).toBe('a &amp; b&#39;s');
    expect(html).toContain('href="https://www.rapidstylers.ca/x?a=1&amp;b=&quot;2&quot;"');
    expect(attr(html, 'name="twitter:card"')).toBe('summary_large_image');
  });

  it('marks demo pages noindex, once', () => {
    const html = applyHeadTags(addNoindex(shell), pageMeta('/blog', { noindex: true }));
    expect(count(html, /name="robots"/g)).toBe(1);
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(addNoindex(addNoindex(shell))).toBe(addNoindex(shell));
  });

  it('falls back to the site defaults for an unknown page', () => {
    expect(headTags(pageMeta('/nope'))).toContain('<link rel="canonical" href="https://www.rapidstylers.ca/" />');
  });
});

describe('prerendered routes', () => {
  const app = read('src/App.js');
  const vercel = JSON.parse(read('vercel.json'));
  const sitemap = read('public/sitemap.xml');
  // The page component that owns each route, and so sets its tab title.
  const pageFiles = {
    '/search': 'searchResults.js', '/elevate-your-looks': 'elevateYourLooks.js', '/blog': 'blog.js', '/about': 'aboutUs.js',
    '/terms-and-conditions': 'termsAndConditions.js', '/privacy-policy': 'privacyPolicy.js', '/faqs': 'faqs.js', '/contact-support': 'contactSupport.js',
  };

  it('covers every fixed public page except the root shell', () => {
    expect(PRERENDERED_ROUTES.sort()).toEqual(Object.keys(pageFiles).sort());
  });

  it.each(PRERENDERED_ROUTES)('%s is a real route, in the sitemap, served by Vercel, and titled like its page', (route) => {
    expect(app).toContain(`path="${route}"`);
    expect(sitemap).toContain(`<loc>https://www.rapidstylers.ca${route}</loc>`);
    const rewrite = vercel.rewrites.find(rule => rule.destination === '/:page/index.html');
    expect(rewrite.source).toMatch(new RegExp(`[(|]${route.slice(1)}[|)]`));
    expect(read(`src/pages/generalPages/${pageFiles[route]}`)).toContain(`"${PAGE_SEO[route].title}"`);
  });

  it('keeps the SPA fallback last so it cannot shadow the page shells or the bot rewrites', () => {
    const last = vercel.rewrites[vercel.rewrites.length - 1];
    expect(last.destination).toBe('/index.html');
    expect(vercel.rewrites.findIndex(rule => rule.destination === '/:page/index.html')).toBeLessThan(vercel.rewrites.length - 1);
  });
});
