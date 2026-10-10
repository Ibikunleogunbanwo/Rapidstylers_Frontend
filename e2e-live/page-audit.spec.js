const fs = require('node:fs');
const { test, expect } = require('@playwright/test');
const groups = [
  { role: 'public', pages: ['/', '/about', '/faqs', '/contact-support', '/terms-and-conditions', '/privacy-policy', '/blog', '/search?city=Calgary', '/elevate-your-looks', '/resetPassword', '/styler-signup'] },
  { role: 'customer', pages: ['/dashboard', '/bookAppointment', '/accountSettings', '/updatePersonalInformation', '/savedStylist', '/changePassword', '/notificationSettings', '/notifications', '/support', '/loyalty', '/feedback', '/searchAStyler'] },
  { role: 'admin', pages: ['/admin/categories', '/admin/blog', '/admin/stylers', '/admin/operations', '/admin/payments', '/admin/recovery'] },
];
for (const { role, pages } of groups) {
  test(`${role} pages render against the isolated dev API`, async ({ page }, info) => {
    test.setTimeout(90_000);
    test.skip(role === 'customer' && !process.env.LIVE_CUSTOMER_EMAIL, 'Synthetic customer required');
    test.skip(role === 'admin' && !process.env.LIVE_ADMIN_EMAIL, 'Local admin required');
    const errors = [], responses = [], results = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().startsWith('http://localhost:9095/') && response.status() >= 400) {
        responses.push({ path: new URL(response.url()).pathname, status: response.status() });
      }
    });
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (['http://127.0.0.1:4174', 'http://localhost:9095'].includes(url.origin)) return route.continue();
      return route.abort();
    });
    if (role !== 'public') {
      await page.goto(role === 'admin' ? '/admin/login' : '/login');
      if (role === 'admin') {
        await page.getByPlaceholder('admin@rapidstylers.ca').fill(process.env.LIVE_ADMIN_EMAIL);
        await page.getByPlaceholder('••••••••').fill(process.env.LIVE_ADMIN_PASSWORD);
      } else {
        await page.getByLabel('Email address:', { exact: true }).fill(process.env.LIVE_CUSTOMER_EMAIL);
        await page.getByLabel('Password:', { exact: true }).fill(process.env.LIVE_CUSTOMER_PASSWORD);
      }
      await page.getByRole('button', { name: 'Sign In', exact: true }).click();
      await expect(page).toHaveURL(role === 'admin' ? /\/admin\/categories$/ : /\/dashboard$/);
    }
    for (const path of pages) {
      await page.goto(path);
      if (role === 'customer' && info.project.name === 'mobile') {
        await page.getByRole('button', { name: 'Open dashboard navigation' }).click();
        await expect(page.getByRole('button', { name: 'Close navigation' })).toBeVisible();
        await page.getByRole('button', { name: 'Close navigation' }).click();
        await expect(page.getByRole('button', { name: 'Open dashboard navigation' })).toHaveAttribute('aria-expanded', 'false');
      }
      await page.waitForLoadState('networkidle');
      const result = {
        path, actualPath: new URL(page.url()).pathname,
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        text: (await page.locator('body').innerText()).slice(0, 1400),
      };
      results.push(result);
      expect(result.actualPath).toBe(path.split('?')[0]);
      await expect(page.locator('body')).not.toContainText('Page not found');
    }
    fs.writeFileSync(info.outputPath('page-audit.json'), JSON.stringify({ results, responses, errors }, null, 2));
    await info.attach('page-audit', { body: JSON.stringify({ results, responses, errors }, null, 2), contentType: 'application/json' });
    expect(errors).toEqual([]);
    expect(results.filter(row => row.overflow).map(row => row.path)).toEqual([]);
  });
}
