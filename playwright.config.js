const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", reducedMotion: "reduce" } },
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
