const { test, expect } = require('@playwright/test');
const posts = [
  { id: 1, title: 'The Ultimate Guide to Braiding: From Basic to Intricate Styles', image: 'braiding' },
  { id: 2, title: 'Quick and Easy Hairstyles for Busy Mornings', image: 'morning-styles' },
  { id: 3, title: 'Healthy Hair Tips: Essential Care and Maintenance Guide', image: 'healthy-hair' },
  { id: 4, title: 'Short and Chic: Modern Hairstyles for Short Haircuts', image: 'short-hair' },
];
test('each seeded blog uses its topic image on home, listing and article', async ({ page }) => {
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:4173') return route.continue();
    if (url.origin !== 'https://api.rapidstylers.ca') return route.abort();
    if (route.request().method() === 'OPTIONS') return route.fulfill({status:204});
    const data = posts.map(p => ({...p, content:'Article body', imageUrl:'https://img.freepik.com/legacy.jpg'}));
    return route.fulfill({json:{statusCode:'200',data:url.pathname.endsWith('/list_blog') ? data : url.pathname.endsWith('/single_blog') ? data.find(p=>String(p.id)===url.searchParams.get('id')) : []}});
  });
  const verify = async p => {
    const img = page.url().endsWith('/') ? page.locator('#blog a').filter({hasText:p.title}).locator('img') : page.getByRole('img', {name:p.title,exact:true});
    await img.scrollIntoViewIfNeeded();
    await expect(img).toHaveAttribute('src', `/images/blog/${p.image}.jpg`);
    await expect.poll(async () => {
      await img.scrollIntoViewIfNeeded();
      return img.evaluate(el=>el.complete && el.naturalWidth > 0);
    }).toBe(true);
  };
  for (const path of ['/', '/blog']) {
    await page.goto(path);
    for (const p of posts) await verify(p);
  }
  for (const p of posts) {
    await page.goto(`/blog/${p.id}`);
    await verify(p);
  }
});
