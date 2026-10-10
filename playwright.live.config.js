const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  outputDir: './test-results-live',
  testDir: './e2e-live', workers: 1, timeout: 30_000,
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'off', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174', reuseExistingServer: false,
    env: { REACT_APP_API_BASE_URL: 'http://localhost:9095/rapid_stylers' },
  },
});
