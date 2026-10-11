const { test, expect } = require('@playwright/test');

test.beforeEach(async ({context}) => {
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4173') return route.continue();
    if (url.origin !== 'https://api.rapidstylers.ca') return route.abort();
    const path = url.pathname.split('/rapid_stylers')[1];
    let data = [];
    if (path === '/admin/kpis') data = {customers:24, stylists:5, approvedStylists:3, appointments:10, pendingAppointments:2, completedAppointments:7, openSupportTickets:1};
    if (path === '/admin/styler_verification_queue') data = [{stylerId:'s1', verificationStatus:'PENDING', firstname:'Test', lastname:'Professional'}];
    return route.fulfill({json:{statusCode:'200', data}});
  });
});

test('admin overview opens actionable queues and supports mobile navigation', async ({page}, info) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('rapidstylers_auth_token','test-admin');
    sessionStorage.setItem('rapidstylers_admin_role','admin');
    sessionStorage.setItem('rapidstylers_user_role','ADMIN');
  });
  await page.goto('/admin');
  await expect(page.getByRole('heading',{name:'Dashboard',exact:true})).toBeVisible();
  await expect(page.getByText('24',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Service disputes 0',exact:true}).click();
  await expect(page).toHaveURL(/payments\?section=disputes$/);
  await expect(page.getByText('No service disputes.',{exact:true})).toBeVisible();
  if (info.project.name === 'mobile') {
    await page.getByRole('button',{name:'Menu',exact:true}).click();
    await expect(page.getByRole('button',{name:'Close menu'})).toHaveAttribute('aria-expanded','true');
  }
  await page.getByRole('navigation',{name:'Admin sections'}).getByRole('link',{name:'Gallery',exact:true}).click();
  await expect(page).toHaveURL(/stylers\?section=images$/);
  await expect(page.getByText('No stylist portfolio images uploaded yet.',{exact:false})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/admin');
  await expect(page.getByText('24',{exact:true})).toBeVisible();
  await page.screenshot({path:info.outputPath('admin-overview.png'), fullPage:true});
});

test('hero uses inline video on mobile and desktop when reduced motion is off', async ({page}) => {
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/');
  const video = page.locator('video').first();
  await expect(video).toBeVisible();
  await expect(video).toHaveAttribute('playsinline','');
  await expect(video).toHaveAttribute('autoplay','');
  expect(await video.evaluate(element => element.muted)).toBe(true);
  await expect.poll(() => video.evaluate(element => element.currentTime), {timeout:10000}).toBeGreaterThan(0);
});
