const { test, expect } = require("@playwright/test");

// Link-preview crawlers read the first HTML response and never run the app, so
// each fixed public page must arrive with its own tags, and must still boot the
// app exactly like `/`. scripts/serve-functional.mjs serves build/<route>/index.html
// for these paths the way Vercel does.
const PAGES = {
  "/about": "About us | RapidStylers",
  "/faqs": "FAQs | RapidStylers",
  "/blog": "Blog | RapidStylers",
  "/privacy-policy": "Privacy Policy | RapidStylers",
};

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") return route.continue();
    if (url.origin !== "https://api.rapidstylers.ca") return route.abort();
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204 });
    return route.fulfill({ status: 200, json: { statusCode: "200", data: [] } });
  });
});

const tag = (html, selector) => new RegExp(`<meta ${selector} content="([^"]*)"`).exec(html)?.[1];

for (const [path, title] of Object.entries(PAGES)) {
  test(`${path} arrives with its own preview tags and boots the app`, async ({ page, request }) => {
    const raw = await (await request.get(path)).text();
    expect(raw).toContain(`<title>${title}</title>`);
    expect(tag(raw, 'property="og:title"')).toBe(title);
    expect(tag(raw, 'property="og:url"')).toBe(`https://www.rapidstylers.ca${path}`);
    expect(raw).toContain(`<link rel="canonical" href="https://www.rapidstylers.ca${path}" />`);
    expect(raw).toMatch(/<script type="module" crossorigin src="\/static\/js\/main\.[^"]+\.js"><\/script>/);

    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(path);
    expect(response.headers()["content-security-policy"]).toContain("script-src 'self'");
    await expect(page).toHaveTitle(title);
    await expect(page.locator("#root > *").first()).toBeVisible();
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", title);
    expect(errors).toEqual([]);
  });
}

test("the root shell keeps the site defaults and other pages do not inherit a page shell's tags", async ({ page, request }) => {
  const raw = await (await request.get("/")).text();
  expect(tag(raw, 'property="og:title"')).toBe("RapidStylers");
  expect(raw).toContain('<link rel="canonical" href="https://www.rapidstylers.ca/" />');

  await page.goto("/about");
  await expect(page).toHaveTitle(PAGES["/about"]);
  // Client-side navigation to a page without a shell of its own.
  await page.evaluate(() => { window.history.pushState({}, "", "/login"); window.dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page).toHaveTitle("Sign In | RapidStylers");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "RapidStylers");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://www.rapidstylers.ca/");
});
