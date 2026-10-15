const { test, expect } = require('@playwright/test');
const categories = ['Locs & dreadlocks', 'Buzz cut', 'Braids', 'Cornrows', 'Wigs', 'High-top fade', 'Hair dye', 'Nail Technician', 'Makeup', 'Eyelash extensions', 'Natural hair'];
test('homepage inspiration represents every gallery category and keeps real work separate', async ({page, browserName}, info) => {
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
  const rail = section.getByRole('region', {name:'Browse service inspiration'});
  await expect(section.getByRole('img')).toHaveCount(11);
  const start = await rail.evaluate(el=>el.scrollLeft);
  await section.getByRole('button',{name:'Next styles',exact:true}).click();
  await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(start);
  await section.getByRole('button',{name:'Previous styles',exact:true}).click();
  await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeLessThan(10);
  await rail.scrollIntoViewIfNeeded();
  const box = await rail.boundingBox();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, {steps:12});
  await page.mouse.up();
  await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(start);
  if (browserName === 'chromium' && info.project.use.isMobile) {
    await rail.evaluate(el=>{el.scrollLeft=0;});
    await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeLessThan(10);
    const touchBox = await rail.boundingBox();
    const session = await page.context().newCDPSession(page);
    const x = touchBox.x + touchBox.width * 0.8;
    const y = touchBox.y + touchBox.height * 0.5;
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for (let step=1; step<=12; step++) {
      await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-touchBox.width*0.6*step/12,y}]});
    }
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(10);
    await session.detach();
  }
  await rail.focus();
  await rail.press('ArrowRight');
  await expect.poll(()=>rail.evaluate(el=>el.scrollLeft)).toBeGreaterThan(start);
  const seen = new Set();
  for (const category of categories) {
    const heading = section.getByRole('heading', {name:category,exact:true});
    const card = heading.locator('..');
    const photo = card.getByRole('img');
    await expect.poll(async()=>{
      await photo.scrollIntoViewIfNeeded();
      return photo.evaluate(el=>el.complete && el.naturalWidth>0);
    }).toBe(true);
    const offsets = await card.evaluate(el=>{
      const title=el.querySelector('h3').getBoundingClientRect();
      const image=el.querySelector('img').getBoundingClientRect();
      return {title:title.x,image:image.x};
    });
    expect(Math.abs(offsets.title-offsets.image)).toBeLessThan(2);
    seen.add(await photo.getAttribute('src'));
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
