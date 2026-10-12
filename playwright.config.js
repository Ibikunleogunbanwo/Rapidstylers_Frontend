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
  // Every engine we claim to support runs here, and CI runs all of them, so a
  // browser-specific defect cannot sit unnoticed between releases. The two
  // Chromium projects keep their names because screenshots are written under
  // them; specs decide what to do from the viewport or from what is on screen
  // (`info.project.use.viewport`, a visible Menu button) rather than from a
  // project name, so `safari-iphone` gets the same checks as `mobile` instead of
  // quietly skipping the phone-only ones.
  //
  // `webkit` is the engine real Safari and iPhone use; `safari-iphone` runs that
  // same engine at an iPhone viewport, which is how the layout is checked on the
  // device most likely to be used. They are separate projects because a single
  // project takes one set of emulation settings for its whole run.
  //
  // `firefox` has to be optional. It cannot launch on every machine (Playwright
  // reports "Could not find profile folder" on hosts missing its runtime
  // prerequisites), and a browser the suite cannot start is not a signal about
  // the app. It is therefore included by default and skipped only when
  // PLAYWRIGHT_SKIP_FIREFOX is set, which CI never sets.
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" } },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium", reducedMotion: "reduce" } },
    ...(process.env.PLAYWRIGHT_SKIP_FIREFOX ? [] : [
      { name: "firefox", use: { ...devices["Desktop Firefox"], browserName: "firefox", reducedMotion: "reduce" } },
    ]),
    { name: "webkit", use: { ...devices["Desktop Safari"], browserName: "webkit", reducedMotion: "reduce" } },
    { name: "safari-iphone", use: { ...devices["iPhone 13"], browserName: "webkit", reducedMotion: "reduce" } },
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
