/**
 * Keeps local development off the production API.
 *
 * `.env.local` points `REACT_APP_API_BASE_URL` at the deployed backend so a
 * developer's checkout talks to real data. That is convenient until someone
 * runs `npm run dev` expecting a local backend and silently sends real login,
 * booking and refund traffic to production — the running app looks fine, so
 * nothing warns them.
 *
 * `resolveApiBaseUrl` refuses that combination: in a development run it drops
 * a production URL and falls back to the local backend, logging loudly so the
 * cause is obvious. Production builds and tests are untouched — the caller
 * decides `dev`, and only `vite` (mode `development`) sets it. The function is
 * pure so the rule can be tested without booting a server.
 */
export const LOCAL_API_BASE_URL = "http://localhost:9095/rapid_stylers";

/** The deployed API host. A value on this host is production traffic. */
export const PRODUCTION_API_HOST = "api.rapidstylers.ca";

/** True when a configured base URL targets the production API host. */
export const isProductionApiUrl = (url) => {
  if (!url) return false;
  try {
    return new URL(url).hostname === PRODUCTION_API_HOST;
  } catch {
    return false;
  }
};

/**
 * Resolves the API base URL for the current run.
 *
 * @param configured the raw `REACT_APP_API_BASE_URL` value (may be empty)
 * @param options.dev whether this is a local development run
 * @param options.warn how a refusal is reported (defaults to `console.error`)
 */
export const resolveApiBaseUrl = (
  configured,
  { dev = false, warn = console.error } = {},
) => {
  const value = typeof configured === "string" ? configured.trim() : "";
  if (dev && isProductionApiUrl(value)) {
    warn(
      "[RapidStylers] REACT_APP_API_BASE_URL points at production " +
        `(${value}) but this is a local development run. Refusing to send ` +
        `development traffic to production and using ${LOCAL_API_BASE_URL} ` +
        "instead. Remove it from .env.local, or override it at launch to " +
        "test a deployed backend on purpose.",
    );
    return LOCAL_API_BASE_URL;
  }
  return value || LOCAL_API_BASE_URL;
};
