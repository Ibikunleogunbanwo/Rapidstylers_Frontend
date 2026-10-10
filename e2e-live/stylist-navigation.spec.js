const { test, expect } = require('@playwright/test');
const sections = [
  ['Appointments', 'appointments'], ['Calendar', 'calendar'],
  ['Availability', 'availability'], ['Services', 'services'],
  ['My work', 'my-work'], ['Payouts', 'payouts'],
  ['Reviews', 'reviews'], ['My profile', 'profile'], ['Overview', ''],
];
test('stylist signs in and reaches each dashboard section', async ({ page }, testInfo) => {
  test.skip(!process.env.LIVE_STYLER_EMAIL || !process.env.LIVE_STYLER_PASSWORD, 'Requires synthetic accounts in an isolated local database');
  const failures = [];
  page.on('pageerror', error => failures.push(error.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['http://127.0.0.1:4174', 'http://localhost:9095'].includes(url.origin)) return route.continue();
    return route.abort();
  });
  await page.goto('/login');
  await page.getByLabel('Email address:', { exact: true }).fill(process.env.LIVE_STYLER_EMAIL);
  await page.getByLabel('Password:', { exact: true }).fill(process.env.LIVE_STYLER_PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/styler-dashboard$/);
  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Open dashboard navigation' }).click();
    await page.screenshot({ path: testInfo.outputPath('stylist-navigation.png') });
    await page.getByRole('button', { name: 'Close dashboard navigation' }).click();
  }
  for (const [label, path] of sections) {
    if (testInfo.project.name === 'mobile') {
      await page.getByRole('button', { name: 'Open dashboard navigation' }).click();
    }
    const nav = page.getByRole('navigation', { name: 'Stylist dashboard' });
    await nav.getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/styler-dashboard${path ? '/' + path : ''}$`));
    if (testInfo.project.name === 'mobile') {
      await expect(page.getByRole('button', { name: 'Open dashboard navigation' })).toHaveAttribute('aria-expanded', 'false');
      await expect(nav).toBeHidden();
    }
    await expect(page.getByRole('button', { name: 'Sign out', exact: true }).first()).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath('stylist-overview.png') });
  await page.evaluate(() => localStorage.setItem('userSessionData', JSON.stringify({ userId: 'stale-customer' })));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/styler-dashboard$/);
  expect(failures).toEqual([]);
  await page.getByRole('button', { name: 'Sign out', exact: true }).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/styler-dashboard');
  await expect(page).toHaveURL(/\/login$/);
});
