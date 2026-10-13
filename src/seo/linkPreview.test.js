// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { LINK_PREVIEW_BOTS, decodeSegment, isLinkPreviewBot, resolvePreview } from './linkPreview.mjs';
import { handleLinkPreview } from './linkPreviewHandler.mjs';
import handler from '../../api/link-preview.mjs';

const env = { REACT_APP_API_BASE_URL: 'https://api.example.test/rapid_stylers/', REACT_APP_API_KEY: 'public-app-key' };
const UA = {
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  imessage: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0',
  whatsapp: 'WhatsApp/2.23.20.0 A',
  x: 'Twitterbot/1.0',
  linkedin: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
  slack: 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  discord: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  telegram: 'TelegramBot (like TwitterBot)',
};
const HUMANS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  '',
];

const json = (body, status = 200) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) });
const profileId = btoa('STYLER-42');
const profileName = btoa('Ana Studio');
const profile = {
  statusCode: '200',
  data: {
    stylerInformation: {
      businessName: `Ana's "Hair" <Studio> & Co`,
      serviceTypeName: 'Hairstylist',
      description: 'Braids, <b>silk presses</b>\n and colour in Calgary.',
      profileImageUrl: 'https://res.cloudinary.com/demo/image/upload/ana.jpg',
    },
    stylerPortfolio: [{ imageUrl: 'https://res.cloudinary.com/demo/image/upload/work.jpg' }],
  },
};
const meta = (html, selector) => new RegExp(`<meta ${selector} content="([^"]*)"`).exec(html)?.[1];

describe('isLinkPreviewBot', () => {
  it.each(Object.entries(UA))('recognises %s', (_, ua) => expect(isLinkPreviewBot(ua)).toBe(true));
  it.each(HUMANS)('leaves browsers and search engines alone: %s', (ua) => expect(isLinkPreviewBot(ua)).toBe(false));

  it('matches what vercel.json sends to the function', () => {
    const vercel = JSON.parse(readFileSync(resolve(__dirname, '../../vercel.json'), 'utf8'));
    const botRules = vercel.rewrites.filter(rule => rule.destination.startsWith('/api/link-preview'));
    expect(botRules.map(rule => rule.source).sort()).toEqual(['/blog/:id', '/stylistProfile/:id/:name']);
    for (const rule of botRules) {
      const condition = rule.has.find(h => h.type === 'header' && h.key === 'user-agent');
      for (const token of LINK_PREVIEW_BOTS) expect(condition.value).toContain(token);
      const pattern = new RegExp(`^${condition.value}$`);
      for (const ua of Object.values(UA)) expect(pattern.test(ua)).toBe(true);
      for (const ua of HUMANS) expect(pattern.test(ua)).toBe(false);
    }
  });
});

describe('decodeSegment', () => {
  it('decodes the base64 the app writes, including + turned into a space by a query string', () => {
    expect(decodeSegment(btoa('STYLER-42'))).toBe('STYLER-42');
    const plus = btoa('ûï¿'); // base64 "+++/", where the query string turns + into spaces
    expect(decodeSegment(plus.replace(/\+/g, ' '))).toBe('ûï¿');
    expect(decodeSegment('not base64!')).toBe('');
    expect(decodeSegment(undefined)).toBe('');
  });
});

describe('link-preview function', () => {
  it('gives a bot the profile name, description and photo, escaped, read with the website API key', async () => {
    const fetchImpl = vi.fn(() => json(profile));
    const res = await handleLinkPreview({ query: { kind: 'profile', id: profileId, name: profileName }, userAgent: UA.whatsapp, env, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.example.test/rapid_stylers/single_styler?stylerId=STYLER-42');
    expect(init.headers['x-api-key']).toBe('public-app-key');
    expect(init.signal).toBeDefined();
    expect(res.status).toBe(200);
    expect(res.headers['Content-Type']).toMatch(/text\/html/);
    expect(res.headers['Cache-Control']).not.toMatch(/s-maxage/);
    const html = res.body;
    expect(html).toContain('<title>Ana&#39;s &quot;Hair&quot; &lt;Studio&gt; &amp; Co | RapidStylers</title>');
    expect(html).not.toMatch(/<Studio>|<b>/);
    expect(meta(html, 'property="og:description"')).toBe('Braids, &lt;b&gt;silk presses&lt;/b&gt; and colour in Calgary.');
    expect(meta(html, 'property="og:image"')).toBe('https://res.cloudinary.com/demo/image/upload/ana.jpg');
    expect(meta(html, 'name="twitter:image"')).toBe('https://res.cloudinary.com/demo/image/upload/ana.jpg');
    expect(meta(html, 'name="twitter:card"')).toBe('summary_large_image');
    expect(meta(html, 'property="og:type"')).toBe('profile');
    const pageUrl = `https://www.rapidstylers.ca/stylistProfile/${profileId}/${profileName}`;
    expect(meta(html, 'property="og:url"')).toBe(pageUrl);
    expect(html).toContain(`<link rel="canonical" href="${pageUrl}" />`);
    expect(html).toContain(`<a href="${pageUrl}">`);
    expect(html).not.toMatch(/<script|http-equiv/i);
    expect(html).not.toContain('name="robots"');
  });

  it('falls back to a category line and a portfolio photo when the profile has no description or photo', async () => {
    const bare = { statusCode: '200', data: { stylerInformation: { businessName: 'Kim Nails', serviceTypeName: 'Nail Technician', profileImageUrl: 'http://insecure/x.jpg' }, stylerPortfolio: [{ imageUrl: 'https://cdn.example/work.jpg' }] } };
    const out = await resolvePreview({ kind: 'profile', id: profileId, name: profileName }, { env, fetchImpl: () => json(bare) });
    expect(out.description).toBe('Kim Nails, nail technician on RapidStylers. See their work and reviews, and book online.');
    expect(out.image).toBe('https://cdn.example/work.jpg');
  });

  it('gives a bot the blog post title, summary and image', async () => {
    const fetchImpl = vi.fn(() => json({ statusCode: '200', data: { id: 7, title: 'Braids & you', content: 'Long '.repeat(60), imageUrl: 'https://cdn.example/post.jpg' } }));
    const res = await handleLinkPreview({ url: '/api/link-preview?kind=blog&id=7', userAgent: UA.facebook, env, fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.example.test/rapid_stylers/single_blog?id=7');
    expect(res.body).toContain('<title>Braids &amp; you | RapidStylers</title>');
    expect(meta(res.body, 'property="og:type"')).toBe('article');
    expect(meta(res.body, 'property="og:url"')).toBe('https://www.rapidstylers.ca/blog/7');
    expect(meta(res.body, 'property="og:image"')).toBe('https://cdn.example/post.jpg');
    expect(meta(res.body, 'name="description"').length).toBeLessThanOrEqual(155);
  });

  it('does not handle normal visitors: they are sent to the page and the API is never called', async () => {
    const fetchImpl = vi.fn();
    for (const ua of HUMANS) {
      const res = await handleLinkPreview({ query: { kind: 'profile', id: profileId, name: profileName }, userAgent: ua, env, fetchImpl });
      expect(res.status).toBe(307);
      expect(res.headers.Location).toBe(`/stylistProfile/${encodeURIComponent(profileId)}/${encodeURIComponent(profileName)}`);
      expect(res.body).toBe('');
    }
    expect((await handleLinkPreview({ query: { kind: 'blog', id: '7' }, userAgent: HUMANS[0], env, fetchImpl })).headers.Location).toBe('/blog/7');
    expect((await handleLinkPreview({ query: { kind: '//evil.example' }, userAgent: HUMANS[0], env, fetchImpl })).headers.Location).toBe('/');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  const failures = {
    'network error': () => Promise.reject(new TypeError('fetch failed')),
    'HTTP 500': () => json({}, 500),
    'business failure': () => json({ statusCode: '404', message: 'No styler' }),
    'invalid JSON': () => Promise.resolve({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError('bad')) }),
    'slow API': (_, init) => new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason))),
  };
  it.each(Object.keys(failures))('answers with the default tags for the right page on %s', async (name) => {
    const res = await handleLinkPreview({ query: { kind: 'blog', id: '7' }, userAgent: UA.slack, env, fetchImpl: failures[name], timeoutMs: 30 });
    expect(res.status).toBe(200);
    expect(res.body).toContain('<title>RapidStylers</title>');
    expect(meta(res.body, 'property="og:image"')).toBe('https://www.rapidstylers.ca/og-image.png?v=20261012');
    expect(meta(res.body, 'property="og:image:width"')).toBe('1200');
    expect(meta(res.body, 'property="og:image:height"')).toBe('630');
    expect(meta(res.body, 'name="twitter:card"')).toBe('summary_large_image');
    expect(meta(res.body, 'property="og:url"')).toBe('https://www.rapidstylers.ca/blog/7');
  });

  it('uses the defaults, without calling the API, for unusable ids or a missing API base URL', async () => {
    const fetchImpl = vi.fn(() => json(profile));
    const badPost = await resolvePreview({ kind: 'blog', id: '../../admin' }, { env, fetchImpl });
    expect(badPost.url).toBe('https://www.rapidstylers.ca/blog');
    expect((await resolvePreview({ kind: 'profile', id: '%%%', name: 'x' }, { env, fetchImpl })).title).toBe('RapidStylers');
    expect((await resolvePreview({ kind: 'profile', id: profileId, name: profileName }, { env: {}, fetchImpl })).title).toBe('RapidStylers');
    expect((await resolvePreview({ kind: 'other' }, { env, fetchImpl })).url).toBe('https://www.rapidstylers.ca/');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps the demo out of search, like the app does', async () => {
    const res = await handleLinkPreview({ query: { kind: 'profile', id: profileId, name: profileName }, userAgent: UA.linkedin, env: { ...env, REACT_APP_DEMO_MODE: 'true' }, fetchImpl: () => json(profile) });
    expect(res.body).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(res.headers['X-Robots-Tag']).toBe('noindex, nofollow');
  });

  it('adds fb:app_id when REACT_APP_FACEBOOK_APP_ID is set, on success and on fallback', async () => {
    const withId = { ...env, REACT_APP_FACEBOOK_APP_ID: '1234567890' };
    const ok = await handleLinkPreview({ query: { kind: 'profile', id: profileId, name: profileName }, userAgent: UA.facebook ?? UA.slack, env: withId, fetchImpl: () => json(profile) });
    expect(meta(ok.body, 'property="fb:app_id"')).toBe('1234567890');
    const failed = await handleLinkPreview({ query: { kind: 'blog', id: '7' }, userAgent: UA.slack, env: withId, fetchImpl: () => json({}, 500) });
    expect(meta(failed.body, 'property="fb:app_id"')).toBe('1234567890');
    const none = await handleLinkPreview({ query: { kind: 'blog', id: '7' }, userAgent: UA.slack, env, fetchImpl: () => json({}, 500) });
    expect(none.body).not.toContain('fb:app_id');
  });

  it('runs as a Vercel Node function', async () => {
    const original = globalThis.fetch;
    const saved = { ...process.env };
    globalThis.fetch = vi.fn(() => json(profile));
    Object.assign(process.env, env);
    try {
      const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, end: vi.fn() };
      await handler({ url: `/api/link-preview?kind=profile&id=${profileId}&name=${profileName}`, query: { kind: 'profile', id: profileId, name: profileName }, headers: { 'user-agent': UA.imessage } }, res);
      expect(res.statusCode).toBe(200);
      expect(res.headers['Content-Type']).toMatch(/text\/html/);
      expect(res.end.mock.calls[0][0]).toContain('| RapidStylers</title>');
      expect(globalThis.fetch.mock.calls[0][1].headers['x-api-key']).toBe('public-app-key');
    } finally {
      globalThis.fetch = original;
      for (const key of Object.keys(env)) if (!(key in saved)) delete process.env[key]; else process.env[key] = saved[key];
    }
  });
});
