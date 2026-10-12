/**
 * Vercel function: link-preview metadata for stylist profiles and blog posts.
 *
 * vercel.json rewrites /stylistProfile/:id/:name and /blog/:id here only when
 * the User-Agent is a link-preview bot (see src/seo/linkPreview.mjs). It reads
 * the same public API the pages read, with the same REACT_APP_API_BASE_URL,
 * REACT_APP_API_KEY and REACT_APP_DEMO_MODE the build uses, and answers with
 * the page's title, description and image. Everything else lives in
 * src/seo/linkPreview.mjs so it can be tested without Vercel.
 */
import { handleLinkPreview } from '../src/seo/linkPreviewHandler.mjs';

export default async function handler(req, res) {
  const { status, headers, body } = await handleLinkPreview({
    url: req.url,
    query: req.query,
    userAgent: req.headers['user-agent'],
    env: process.env,
  });
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);
  res.statusCode = status;
  res.end(body);
}
