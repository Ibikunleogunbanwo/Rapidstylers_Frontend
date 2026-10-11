const { defineConfig, devices } = require("@playwright/test");

// Temporary: same settings as playwright.config.js, WebKit only, to reproduce
// the navigation/redirect race reported on 2026-10-10.
module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"], reducedMotion: "reduce", browserName: "webkit" } },
  ],
  webServer: {
    command: "npm run build && node scripts/serve-functional.mjs",
    url: "http://127.0.0.1:4173",
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      REACT_APP_API_BASE_URL: "https://api.rapidstylers.ca/rapid_stylers",
      REACT_APP_API_KEY: "functional-public-key",
      REACT_APP_GOOGLE_CLIENT_ID: "",
      REACT_APP_TURNSTILE_SITE_KEY: "",
      REACT_APP_STRIPE_MODE: "test",
      REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY: "",
      REACT_APP_ADSENSE_CLIENT: "",
    },
  },
});
