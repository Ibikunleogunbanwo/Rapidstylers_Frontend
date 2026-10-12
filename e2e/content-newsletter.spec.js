const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4173') return route.continue();
    if (url.origin !== 'https://api.rapidstylers.ca') return route.abort();
    const path = url.pathname.split('/rapid_stylers')[1];
    let data = [];
    if (path === '/admin/site_content') data = { items: [] };
    if (path === '/admin/site_content_item') data = { draft: { items: [{ question: 'Where do appointments happen?', answer: 'At home or at the stylist’s location.', category: 'Booking' }] }, published: null, version: 0 };
    return route.fulfill({ json: { statusCode: '200', data } });
  });
});
test('newsletter confirmation requires a deliberate click and consumes email token', async ({ page }) => {
  let confirmations = 0;
  await page.route('**/newsletter_confirm', async route => {
    confirmations++;
    expect(route.request().postDataJSON()).toEqual({ token: 'synthetic-confirmation-token' });
    await route.fulfill({ json: { statusCode: '200', data: {} } });
  });
  await page.goto('/newsletter/confirm?token=synthetic-confirmation-token');
  await expect(page.getByRole('heading', { name: 'Confirm newsletter subscription' })).toBeVisible();
  expect(confirmations).toBe(0);
  await page.getByRole('button', { name: 'Confirm subscription' }).click();
  await expect(page.getByRole('status')).toHaveText('Your subscription is confirmed.');
  expect(confirmations).toBe(1);
  await expect(page).toHaveURL(/newsletter\/confirm$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('admin edits a FAQ draft without publishing or sending newsletters', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('rapidstylers_auth_token', 'synthetic-admin');
    sessionStorage.setItem('rapidstylers_admin_role', 'admin');
    sessionStorage.setItem('rapidstylers_user_role', 'ADMIN');
  });
  let saved = false;
  await page.route('**/admin/save_site_content', async route => {
    expect(route.request().postDataJSON().content.items[0].answer).toBe('Choose a supported appointment location.');
    saved = true;
    await route.fulfill({ json: { statusCode: '200', data: {} } });
  });
  await page.goto('/admin/content');
  await page.getByLabel('Answer 1').fill('Choose a supported appointment location.');
  await expect(page.getByRole('button', { name: 'Publish saved draft' })).toBeDisabled();
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page.getByRole('status')).toHaveText('Draft saved.');
  expect(saved).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
