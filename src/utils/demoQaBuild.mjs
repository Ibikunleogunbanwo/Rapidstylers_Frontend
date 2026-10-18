/** Demo QA uses the existing demo database through its API, with real account flows. */
export const demoQaBuildEnv = (env) => {
  if (!env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY?.startsWith("pk_test_")) {
    throw new Error("Demo QA requires REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY starting with pk_test_");
  }
  return {
    ...env,
    REACT_APP_DEMO_MODE: "false",
    REACT_APP_DEMO_BOOKING_OPEN: "false",
    REACT_APP_API_BASE_URL: "https://api-demo.rapidstylers.ca/rapid_stylers",
    REACT_APP_STRIPE_MODE: "test",
    REACT_APP_STRIPE_PUBLISHABLE_KEY: "",
    REACT_APP_STRIPE_LIVE_PUBLISHABLE_KEY: "",
  };
};
