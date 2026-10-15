const { test, expect } = require('@playwright/test');
const categories = ['Locs & dreadlocks', 'Buzz cut', 'Braids', 'Cornrows', 'Wigs', 'High-top fade', 'Hair dye', 'Nail Technician', 'Makeup', 'Eyelash extensions', 'Natural hair'];
test('homepage inspiration represents every gallery category and keeps real work separate', async ({page}, info) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4173') return route.continue();
    if (url.origin !== 'https://api.rapidstylers.ca') return route.abort();
    return route.fulfill({status:200,json:{statusCode:'200',data:[]}});
  });
  await page.goto('/');
  const section = page.getByLabel('Service style inspiration', {exact:true});
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByText(/AI generated style inspiration/)).toBeVisible();
  const seen = new Set();
  for (const category of categories) {
    const button = section.getByRole('button', {name:category,exact:true});
    await button.click();
    await expect(button).toHaveAttribute('aria-pressed','true');
    const photos = section.getByRole('img');
    await expect(photos).toHaveCount(1);
    for (const photo of await photos.all()) {
      await expect.poll(async()=>{
        await photo.scrollIntoViewIfNeeded();
        return photo.evaluate(el=>el.complete && el.naturalWidth>0);
      }).toBe(true);
      seen.add(await photo.getAttribute('src'));
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  }
  expect(seen.size).toBe(11);
  await section.screenshot({path:info.outputPath('service-inspiration.png')});
  await page.getByRole('link',{name:'Browse gallery',exact:true}).click();
  await expect(page).toHaveURL(/\/elevate-your-looks$/);
  await expect(page.getByLabel('Service style inspiration',{exact:true})).toHaveCount(0);
  if (process.env.REACT_APP_DEMO_MODE === 'true') {
    await expect(page.locator('img[src^="/images/inspiration/"]')).toHaveCount(33);
    for (const [index, category] of categories.entries()) {
      await page.getByRole('button', {name:category,exact:true}).click();
      await expect(page.locator('img[src^="/images/inspiration/"]')).toHaveCount(3);
      const prefix = ['locs','buzz','braids','cornrows','wigs','high-top','colour','nails','makeup','lashes','natural'][index];
      await expect(page.locator('img[src^="/images/inspiration/"]').first()).toHaveAttribute('src', `/images/inspiration/${prefix}-1.jpg`);
      for (const photo of await page.locator('img[src^="/images/inspiration/"]').all()) {
        await expect.poll(async()=>{await photo.scrollIntoViewIfNeeded();return photo.evaluate(el=>el.complete && el.naturalWidth>0);}).toBe(true);
      }
    }
  } else {
    await expect(page.locator('img[src^="/images/inspiration/"]')).toHaveCount(0);
  }
});
