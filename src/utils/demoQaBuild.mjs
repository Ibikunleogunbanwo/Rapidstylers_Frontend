const DEMO_API_BASE_URL = "https://api-demo.rapidstylers.ca/rapid_stylers";
/** This site's own API proxy path; the proxy's upstream (API_UPSTREAM_URL) is set server-side. */
const PROXY_API_BASE_URL = "/rapid_stylers";

/**
 * Demo QA uses the existing demo database through its API, with real account flows.
 * It may go straight to the demo API or through this site's proxy, but never to
 * any other host: a live-site default must not leak into a QA build.
 */
export const demoQaBuildEnv = (env) => {
  if (!env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
    throw new Error("Demo QA requires REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY starting with pk_test_");
  }
  return {
    ...env,
    REACT_APP_DEMO_MODE: "false",
    REACT_APP_DEMO_BOOKING_OPEN: "false",
    REACT_APP_API_BASE_URL: env.REACT_APP_API_BASE_URL?.trim() === PROXY_API_BASE_URL ? PROXY_API_BASE_URL : DEMO_API_BASE_URL,
    REACT_APP_STRIPE_MODE: "test",
    REACT_APP_STRIPE_PUBLISHABLE_KEY: "",
    REACT_APP_STRIPE_LIVE_PUBLISHABLE_KEY: "",
  };
};
