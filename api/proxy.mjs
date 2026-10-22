/**
 * Vercel Edge function behind /rapid_stylers/* (see the rewrite in
 * vercel.json): relays the request to the API, adding the server-only API key.
 * All logic lives in src/proxy/apiProxy.mjs, where it is unit tested.
 */
import { handleProxy } from '../src/proxy/apiProxy.mjs';

export const config = { runtime: 'edge' };

export default function handler(request) {
  return handleProxy(request, { env: process.env });
}
