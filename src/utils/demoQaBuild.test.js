import { demoQaBuildEnv } from "./demoQaBuild.mjs";

test("QA builds keep sign-in and booking on the demo API even with live deployment defaults", () => {
  const env = demoQaBuildEnv({
    REACT_APP_DEMO_MODE: "true",
    REACT_APP_API_BASE_URL: "https://api.rapidstylers.ca/rapid_stylers",
    REACT_APP_STRIPE_MODE: "live",
    REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY: "pk_test_qa",
    REACT_APP_STRIPE_LIVE_PUBLISHABLE_KEY: "pk_live_unused",
    REACT_APP_API_KEY: "existing-api-key",
  });
  expect(env.REACT_APP_DEMO_MODE).toBe("false");
  expect(env.REACT_APP_API_BASE_URL).toBe("https://api-demo.rapidstylers.ca/rapid_stylers");
  expect(env.REACT_APP_STRIPE_MODE).toBe("test");
  expect(env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY).toBe("pk_test_qa");
  expect(env.REACT_APP_STRIPE_LIVE_PUBLISHABLE_KEY).toBe("");
  expect(env.REACT_APP_API_KEY).toBe("existing-api-key");
});

test.each([undefined, "", "pk_live_wrong"])("QA builds reject a missing or live test-key value: %s", (key) => {
  expect(() => demoQaBuildEnv({ REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY: key }))
    .toThrow(/pk_test_/);
});

test("QA builds may use this site's API proxy, which hides the demo API host and key", () => {
  const env = demoQaBuildEnv({ REACT_APP_API_BASE_URL: "/rapid_stylers", REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY: "pk_test_qa" });
  expect(env.REACT_APP_API_BASE_URL).toBe("/rapid_stylers");
});
