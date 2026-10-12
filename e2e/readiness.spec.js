const { test, expect } = require("@playwright/test");

// These tests exercise the production frontend with deterministic API responses.
// They do not establish payment-provider or live backend correctness.
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:4173") return route.continue();
    if (url.origin !== "https://api.rapidstylers.ca") return route.abort();
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204 });
    const path = url.pathname.split("/rapid_stylers")[1];
    let data = [];
    let extra = {};
    if (path === "/sign_in") {
      const email = route.request().postDataJSON().emailAddress;
      const role = email.startsWith("admin") ? "ADMIN" : email.startsWith("styler") ? "STYLER" : "CUSTOMER";
      data = { role, account: { userId: "test-customer", firstname: "Test", emailAddress: email } };
      extra = { token: `functional-${role}`, refreshToken: "functional-refresh" };
    } else if (path === "/user_data") {
      data = { userData: { userId: "test-customer", firstname: "Test", lastname: "Client" } };
    } else if (path === "/list_service") {
      data = [{ id: "test-category", serviceTypeId: "test-category", serviceTypeName: "Hair", serviceName: "Hair" }];
    } else if (path === "/styler/business_summary" || path === "/styler/connect_status") {
      data = {};
    } else if (path === "/single_styler") {
      data = {
        stylerInformation: { stylerId: "s1", businessName: "Test Salon", province: "Alberta", city: "Calgary", timeZone: "America/Edmonton", serviceTypeId: "test-category", reviewCount: 0 },
        stylerSubService: [{ id: "ss1", name: "Test Haircut", price: "60", durationMinutes: 60 }],
        availability: [], exceptions: [], bookedSlots: [], stylerPortfolio: [], stylerReviews: [],
      };
    } else if (path === "/booking_estimate") {
      data = { serviceSubtotal: "60.00", travelFee: "0.00", totalPrice: "60.00", includedTravelKm: 10, travelDistanceKm: 0 };
    }
    return route.fulfill({ status: 200, json: { statusCode: "200", data, ...extra } });
  });
});

test("landing keeps media static for reduced motion and fits the viewport", async ({ page }) => {
  const videoRequests = [];
  page.on("request", request => { if (/\.mp4(?:\?|$)/.test(request.url())) videoRequests.push(request.url()); });
  const response = await page.goto("/");
  await expect(page.getByRole("heading", { name: "Beauty services at home or at a stylist’s location" })).toBeVisible();
  await expect(page.locator("video[src]")).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Beauty tools ready for your appointment" })).toBeVisible();
  expect(videoRequests).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("landing.png"), fullPage: true, scale: "css" });
  expect(response.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("brand logo animation plays on desktop and mobile", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const logo = page.getByLabel("RapidStylers logo animation");
  // Real pointer input releases history restoration before seeking the logo.
  await page.getByRole("heading", { level: 1 }).click();
  await logo.scrollIntoViewIfNeeded();
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate(video => ({ playing: video.currentTime > 0, paused: video.paused, readyState: video.readyState, error: video.error?.message || null })), { timeout: 10000 }).toMatchObject({ playing: true, error: null });
  // `playsInline` is checked as an attribute, not as `video.playsInline`: the
  // property is only exposed on WebKit/Chromium, so reading it in Firefox gives
  // `undefined` and `undefined && …` is `undefined` — an assertion that can
  // never pass there. The attribute is what decides inline playback on iOS, and
  // all three engines put it in the DOM. Muting is read from the property,
  // because that is what stops autoplay from being blocked.
  expect(await logo.evaluate(video => video.getAttribute("playsinline") !== null)).toBe(true);
  expect(await logo.evaluate(video => video.muted)).toBe(true);
  // videoWidth needs a decoded frame, so it is polled rather than read once:
  // one cold read can land before the metadata has arrived.
  await expect.poll(() => logo.evaluate(video => video.videoWidth), { timeout: 10_000 }).toBeGreaterThan(0);
});

test("invalid login is accessible and never sends credentials", async ({ page }) => {
  let requests = 0;
  page.on("request", request => { if (request.url().endsWith("/sign_in")) requests++; });
  await page.goto("/login");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByLabel("Email address", { exact: false })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Email address is required", { exact: true })).toBeVisible();
  await expect(page.getByText("Password is required", { exact: true })).toBeVisible();
  expect(requests).toBe(0);
});

for (const [route, login] of [["/dashboard", "/login"], ["/styler-dashboard", "/login"], ["/admin/categories", "/admin/login"]]) {
  test(`signed-out ${route} redirects to ${login}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${login}$`));
    await expect(page.getByRole("button", { name: "Sign In", exact: true })).toBeVisible();
  });
}

test("admin logout clears credentials immediately and preserves unrelated preferences", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: false }).fill("admin@example.test");
  await page.getByLabel("Password:", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/categories$/);
  await page.evaluate(() => localStorage.setItem("functional-preference", "keep"));
  let finishLogout;
  const logoutGate = new Promise(resolve => { finishLogout = resolve; });
  await page.route("**/auth/logout", async route => {
    await logoutGate;
    await route.fulfill({ status: 200, json: { statusCode: "200", data: [] } }).catch(() => {});
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(await page.evaluate(() => ({ token: sessionStorage.getItem("rapidstylers_auth_token"), refresh: sessionStorage.getItem("rapidstylers_refresh_token"), preference: localStorage.getItem("functional-preference") }))).toEqual({ token: null, refresh: null, preference: "keep" });
  finishLogout();
  await page.goto("/admin/categories");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("booking replays an uncertain result with the same key after a reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: false }).fill("customer@example.test");
  await page.getByLabel("Password:", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  const requests = [];
  await page.route("**/book_appointment", route => {
    requests.push({ key: route.request().headers()["idempotency-key"], body: route.request().postDataJSON() });
    if (requests.length === 1) return route.abort("failed");
    if (requests.length === 2) return route.fulfill({ status: 200, json: { statusCode: null, data: null, message: null } });
    return route.fulfill({ status: 200, json: { statusCode: "200", data: { appointmentId: "test-booking" } } });
  });
  await page.goto("/stylistProfile/czE=/VGVzdCBTYWxvbg==");
  await page.getByRole("button", { name: "Book service", exact: true }).click();
  // The picker is date-first: arrival times appear only once a date is chosen.
  await page.getByText(/ · today$/).click();
  await page.getByText("4:00 pm", { exact: true }).click();
  await page.getByRole("button", { name: "Book appointment", exact: true }).click();
  await expect(page.getByText(/could not confirm whether your booking/i)).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Book service", exact: true }).click();
  await page.getByRole("button", { name: "Book appointment", exact: true }).click();
  await expect(page.getByText(/could not confirm whether your booking/i)).toBeVisible();
  await expect(page.getByTestId("booking-placed")).toHaveCount(0);
  await page.getByRole("button", { name: "Book appointment", exact: true }).click();
  await expect(page.getByTestId("booking-placed")).toBeVisible();
  expect(requests).toHaveLength(3);
  expect(requests[2]).toEqual(requests[0]);
  expect(requests[0].key).toMatch(/^[\da-f-]{36}$/);
  expect(requests[1]).toEqual(requests[0]);
});

test('stylist overview shows real appointments and profile sharing targets its public page', async ({page}) => {
  const subject = 'GS123';
  await page.route('**/sign_in', route => route.fulfill({status:200,json:{statusCode:'200',token:`header.${Buffer.from(JSON.stringify({sub:subject})).toString('base64url')}.signature`,refreshToken:'refresh',data:{role:'STYLER',account:{stylerId:subject}}}}));
  await page.route('**/styler_appointments', route => route.fulfill({status:200,json:{statusCode:'200',data:[{appointmentId:'A1',statusCode:'3',appointmentDate:'2026-10-15',arrivalTime:'10:00',userData:{firstname:'Ada',lastname:'Lee'},subServiceData:{name:'Braids'},stylerData:{timeZone:'America/Edmonton'}}]}}));
  await page.route('**/styler/profile', route => route.fulfill({status:200,json:{statusCode:'200',data:{serviceTypeId:'test-category',firstname:'Ada',lastname:'Lee',emailAddress:'styler@example.test',phoneNumber:'5875551234',businessName:'Test Salon',description:'Calm studio.',streetAddress:'1 Main St',unit:'',city:'Calgary',province:'AB',postalCode:'T2P 1B5',country:'Canada',businessAddress:'1 Main St, Calgary, AB T2P 1B5, Canada',timeZone:'America/Edmonton'}}}));
  await page.goto('/login');
  await page.getByLabel('Email address',{exact:false}).fill('styler@example.test');
  await page.getByLabel('Password:',{exact:true}).fill('TestPassword123!');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page).toHaveURL(/\/styler-dashboard$/);
  await expect(page.getByText('Ada Lee')).toBeVisible();
  await expect(page.getByRole('link',{name:'Open calendar'})).toHaveAttribute('href','/styler-dashboard/calendar');
  await page.goto('/styler-dashboard/profile');
  await expect(page.getByRole('link',{name:'View public profile'})).toHaveAttribute('href',new RegExp(`/stylistProfile/${encodeURIComponent(Buffer.from(subject).toString('base64'))}/`));
  await page.getByRole('link',{name:'Update business information'}).click();
  await expect(page.getByLabel('Business name:')).toHaveValue('Test Salon');
  await expect(page.getByRole('button',{name:'Save changes'})).toBeVisible();
});

test('failed stylist availability read prevents saving defaults and supports retry',async({page})=>{
  let failed=true;
  await page.route('**/styler_availability',route=>route.fulfill({status:failed?503:200,json:failed?{message:'Unavailable'}:{statusCode:'200',data:[]}}));
  await page.goto('/login');
  await page.getByLabel('Email address',{exact:false}).fill('styler@example.test');
  await page.getByLabel('Password:',{exact:true}).fill('TestPassword123!');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page).toHaveURL(/\/styler-dashboard$/);
  await page.goto('/styler-dashboard/availability');
  await expect(page.getByRole('alert').filter({hasText:'Could not load'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Save hours'})).toBeDisabled();
  failed=false;
  await page.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(page.getByRole('button',{name:'Save hours'})).toBeEnabled();
});

test('booking discovery has clear sections, category image fallbacks and working search',async({page},info)=>{
  const categories=[
    {id:'hair',serviceName:'Hairstylist'},
    {id:'barber',serviceName:'Barber',imageUrl:'/images/missing-category.jpg'},
    {id:'nails',serviceName:'Nail Technician'},
    {id:'makeup',serviceName:'Makeup Artist'},
    {id:'lashes',serviceName:'Eyelash Technician'},
    {id:'new',serviceName:'New service'},
  ];
  await page.route('**/list_service',route=>route.fulfill({status:200,json:{statusCode:'200',data:categories}}));
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Email address',{exact:false}).fill('customer@example.test');
  await page.getByLabel('Password:',{exact:true}).fill('TestPassword123!');
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // The dashboard's own appointment reads must settle before this test navigates
  // away. A request cut short by navigation is reported by WebKit as "XMLHttpRequest
  // cannot load ... due to access control checks", which would land in `errors`
  // below and mask a real failure. "Your bookings" only renders once both reads
  // have answered, so waiting for it asserts the dashboard loaded as well.
  await expect(page.getByRole('heading',{name:'Your bookings',exact:true})).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.goto('/bookAppointment');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading',{name:'Choose a service'})).toBeVisible();
  await expect(page.getByText('ADVERTISEMENT',{exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Find a professional by name'})).toBeVisible();
  for(const name of categories.slice(0,5).map(category=>category.serviceName)){
    await expect(page.getByRole('img',{name,exact:true})).toHaveAttribute('src',/^\/images\/gallery\//);
    await expect.poll(()=>page.getByRole('img',{name,exact:true}).evaluate(image=>image.complete && image.naturalWidth>0)).toBe(true);
  }
  await expect(page.getByRole('img',{name:'New service illustration'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath(`booking-clarity-${info.project.name}.png`),fullPage:true});
  await page.getByRole('link',{name:'Hairstylist',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`/stylist/${Buffer.from('hair').toString('base64')}/${Buffer.from('Hairstylist').toString('base64')}$`));
  await page.waitForLoadState('networkidle');
  await page.goto('/bookAppointment');
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox',{name:'Professional name'}).fill('Ada');
  await page.getByRole('button',{name:'Search by name'}).click();
  await expect(page).toHaveURL(/\/searchAStyler$/);
  await expect(page.getByPlaceholder('Search for a professional')).toHaveValue('Ada');
  expect(errors).toEqual([]);
});


test('stylist navigation gives every tab a focused workspace and logout survives back and refresh', async ({page}, info) => {
  await page.goto('/login');
  await page.getByLabel('Email address', {exact:false}).fill('styler@example.test');
  await page.getByLabel('Password:', {exact:true}).fill('TestPassword123!');
  await page.getByRole('button', {name:'Sign In', exact:true}).click();
  await expect(page).toHaveURL(/\/styler-dashboard$/);
  await expect(page.getByRole('heading', {level:1, name:'Overview', exact:true})).toBeVisible();
  const tabs = [['Overview',''],['Appointments','/appointments'],['Calendar','/calendar'],['Availability','/availability'],['Services','/services'],['My work','/my-work'],['Payouts','/payouts'],['Reviews','/reviews'],['My profile','/profile']];
  for (const [label, path] of tabs) {
    const toggle = page.getByRole('button', {name:'Open dashboard navigation'});
    if (await toggle.isVisible()) await toggle.click();
    await page.getByRole('navigation', {name:'Stylist dashboard'}).getByRole('link', {name:label, exact:true}).click();
    await expect(page).toHaveURL(new RegExp(`/styler-dashboard${path}$`));
    await expect(page.getByRole('heading', {level:1, name:label, exact:true})).toBeVisible();
    await expect(page.getByRole('complementary', {name:'Business overview'})).toHaveCount(path ? 0 : 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({path:info.outputPath(`stylist-${label.replaceAll(' ', '-')}.png`), fullPage:true});
  }
  await page.getByRole('button', {name:'Sign out', exact:true}).first().click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('button', {name:'Sign In', exact:true})).toBeVisible();
});
