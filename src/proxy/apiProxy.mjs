/**
 * The frontend's API proxy. The browser calls this site's own /rapid_stylers/*
 * path; a Vercel function relays it to the real API. The browser never sees the
 * API host or the API key: the key is added here, from a server-only variable.
 *
 * Because the API now sees Vercel rather than the visitor, the visitor's IP and
 * Vercel's geolocation of them travel in X-RS-* headers, signed with a shared
 * secret the API checks (FrontendProxyTrust on the backend).
 *
 * Server env (set in each Vercel project, never REACT_APP_*):
 *   API_UPSTREAM_URL       e.g. https://api.rapidstylers.ca (no trailing path)
 *   API_KEY                the API key the browser used to carry
 *   FRONTEND_PROXY_SECRET  same value as the backend's FRONTEND_PROXY_SECRET
 */

export const PROXY_PATH_PARAM = '__path';

/** Request headers never relayed: hop-by-hop, routing, and anything the proxy sets itself. */
const DROPPED_REQUEST_HEADERS = new Set([
  'host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'upgrade',
  'x-api-key', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-forwarded-port',
  'x-real-ip', 'forwarded', 'cookie',
]);
const DROPPED_REQUEST_PREFIXES = ['x-vercel-', 'cf-', 'x-rs-'];

/** Response headers not copied back: the platform recomputes these. */
const DROPPED_RESPONSE_HEADERS = new Set(['content-encoding', 'content-length', 'transfer-encoding', 'connection']);

/** Only this API's own paths can be reached; no traversal out of it. */
const SAFE_PATH = /^[A-Za-z0-9_\-./]*$/;

export function upstreamUrl(requestUrl, upstreamBase) {
  const url = new URL(requestUrl);
  const path = (url.searchParams.get(PROXY_PATH_PARAM) || '').replace(/^\/+/, '');
  if (!SAFE_PATH.test(path) || path.split('/').some((part) => part === '..')) return null;
  url.searchParams.delete(PROXY_PATH_PARAM);
  const base = String(upstreamBase || '').replace(/\/+$/, '');
  if (!/^https?:\/\//.test(base)) return null;
  const query = url.searchParams.toString();
  return `${base}/rapid_stylers/${path}${query ? `?${query}` : ''}`;
}

/** The visitor's IP as Vercel saw it: the left-most X-Forwarded-For entry. */
export function visitorIp(headers) {
  const forwarded = headers.get('x-forwarded-for') || '';
  const first = forwarded.split(',')[0].trim();
  return first || headers.get('x-real-ip') || '';
}

export function upstreamHeaders(incoming, env) {
  const headers = new Headers();
  for (const [name, value] of incoming.entries()) {
    const key = name.toLowerCase();
    if (DROPPED_REQUEST_HEADERS.has(key) || DROPPED_REQUEST_PREFIXES.some((p) => key.startsWith(p))) continue;
    headers.set(name, value);
  }
  if (env.API_KEY) headers.set('x-api-key', env.API_KEY);
  if (env.FRONTEND_PROXY_SECRET) {
    headers.set('X-RS-Proxy-Secret', env.FRONTEND_PROXY_SECRET);
    const ip = visitorIp(incoming);
    if (ip) headers.set('X-RS-Client-IP', ip);
    const geo = {
      'X-RS-Geo-Latitude': 'x-vercel-ip-latitude',
      'X-RS-Geo-Longitude': 'x-vercel-ip-longitude',
      'X-RS-Geo-City': 'x-vercel-ip-city',
      'X-RS-Geo-Region': 'x-vercel-ip-country-region',
      'X-RS-Geo-Country': 'x-vercel-ip-country',
    };
    for (const [out, from] of Object.entries(geo)) {
      const value = incoming.get(from);
      if (value) headers.set(out, value);
    }
  }
  return headers;
}

export function responseHeaders(upstream) {
  const headers = new Headers();
  for (const [name, value] of upstream.entries()) {
    if (!DROPPED_RESPONSE_HEADERS.has(name.toLowerCase())) headers.append(name, value);
  }
  headers.set('Cache-Control', upstream.get('cache-control') || 'no-store');
  return headers;
}

const json = (status, message) => new Response(JSON.stringify({ statusCode: String(status), message }), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export async function handleProxy(request, { env = {}, fetchImpl = globalThis.fetch } = {}) {
  const target = upstreamUrl(request.url, env.API_UPSTREAM_URL);
  if (!target) return json(env.API_UPSTREAM_URL ? 400 : 503, env.API_UPSTREAM_URL ? 'Bad request path' : 'API proxy is not configured');
  const method = request.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  try {
    const upstream = await fetchImpl(target, {
      method,
      headers: upstreamHeaders(request.headers, env),
      body: hasBody ? request.body : undefined,
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
    });
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders(upstream.headers) });
  } catch {
    return json(502, 'The service is temporarily unavailable. Please try again.');
  }
}
