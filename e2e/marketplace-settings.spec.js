const {test,expect}=require('@playwright/test');
const areas={restricted:false,areas:[],approvedStylistsOutside:[],provinces:['Alberta','Ontario']};
const travel={offersSalonVisits:true,offersHomeVisits:true,includedTravelKm:20,baseTravelFee:'12.50',maxTravelKm:50};
const funnel={from:'2026-10-01',to:'2026-10-11',timeZone:'America/Edmonton',steps:[{step:'VISITED',count:12,conversionFromPrevious:null,conversionFromStart:100},{step:'ACCOUNT_CREATED',count:3,conversionFromPrevious:25,conversionFromStart:25}],previousPeriod:{from:'2026-09-20',to:'2026-09-30',steps:[{step:'VISITED',count:8},{step:'ACCOUNT_CREATED',count:2}]},trend:[{periodStart:'2026-10-01',periodEnd:'2026-10-01',VISITED:12,ACCOUNT_CREATED:3}],definitions:{conversion:'Counts are not cohort conversion; rates may exceed 100%.'}};
async function auth(page,role){await page.addInitScript(role=>{sessionStorage.setItem('rapidstylers_auth_token','fixture-token');sessionStorage.setItem('rapidstylers_user_role',role);if(role==='ADMIN')sessionStorage.setItem('rapidstylers_admin_role','admin');},role);}
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());if(url.origin==='http://127.0.0.1:4173')return route.continue();if(url.origin!=='https://api.rapidstylers.ca')return route.abort();if(route.request().method()==='OPTIONS')return route.fulfill({status:204});
  const path=url.pathname.split('/rapid_stylers')[1];let data=[];
  if(path==='/admin/service_areas')data=areas;
  if(path==='/admin/signup_funnel')data=funnel;
  if(path==='/styler/travel_settings')data=travel;
  if(path==='/update_styler_travel_settings')data={...travel,...route.request().postDataJSON()};
  if(path==='/admin/save_service_area')data={id:1,...route.request().postDataJSON()};
  if(path==='/admin/save_promo_code')data={id:1,...route.request().postDataJSON()};
  if(path==='/styler/profile')data={businessName:'QA studio',businessAddress:'1 Test Street, Calgary',streetAddress:'1 Test Street',city:'Calgary',province:'Alberta'};
  if(path==='/styler/connect_status')data={status:'COMPLETE'};
  return route.fulfill({json:{statusCode:'200',data}});
 });
});
test('service area form validates and saves an explicit inactive city',async({page},info)=>{
 await auth(page,'ADMIN');await page.goto('/admin/service-areas');await expect(page.getByRole('heading',{name:'Service areas',exact:true})).toBeVisible();await expect(page.getByText('No geographic restriction is active.')).toBeVisible();
 await page.getByLabel('Province or territory').selectOption('Alberta');await page.getByLabel('City (leave blank for the whole province)').fill('Calgary');await page.getByLabel('Active',{exact:true}).uncheck();page.once('dialog',dialog=>dialog.accept());
 const request=page.waitForRequest(r=>r.url().endsWith('/admin/save_service_area'));await page.getByRole('button',{name:'Save area'}).click();expect((await request).postDataJSON()).toEqual({province:'Alberta',city:'Calgary',note:'',active:false});await expect(page.getByText('Service areas updated.')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('service-area.png'),fullPage:true});
});
test('promotion editor sends percentage, UTC dates, limits and inactive state',async({page})=>{
 await auth(page,'ADMIN');await page.goto('/admin/promotions');await expect(page.getByRole('heading',{name:'Promotions',exact:true})).toBeVisible();await page.getByLabel('Code',{exact:true}).fill('welcome');await page.getByLabel('Discount value',{exact:true}).fill('10');await page.getByLabel('Starts (UTC, optional)').fill('2026-10-11T12:30');await page.getByLabel('Uses per customer').fill('2');await page.getByLabel('First booking only').check();await page.getByLabel('Active',{exact:true}).uncheck();
 const request=page.waitForRequest(r=>r.url().endsWith('/admin/save_promo_code'));await page.getByRole('button',{name:'Save promotion'}).click();expect((await request).postDataJSON()).toEqual(expect.objectContaining({code:'WELCOME',discountType:'PERCENT',discountValue:'10',startsAt:'2026-10-11T12:30:00',maxPerCustomer:'2',firstBookingOnly:true,active:false}));await expect(page.getByText('Promotion saved.')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('funnel report applies filters and explains non-cohort conversion',async({page})=>{
 await auth(page,'ADMIN');await page.goto('/admin/signup-funnel');await expect(page.getByRole('heading',{name:'Signup funnel',exact:true})).toBeVisible();await expect(page.getByText('2026-10-01 – 2026-10-11 · America/Edmonton')).toBeVisible();await page.getByLabel('Account type').selectOption('STYLIST');await page.getByLabel('From',{exact:true}).fill('2026-10-01');await page.getByLabel('To',{exact:true}).fill('2026-10-11');await page.getByLabel('Group by').selectOption('week');
 const request=page.waitForRequest(r=>r.url().includes('/admin/signup_funnel?')&&r.url().includes('role=STYLIST'));await page.getByRole('button',{name:'Apply filters'}).click();const params=new URL((await request).url()).searchParams;expect(params.get('from')).toBe('2026-10-01');expect(params.get('to')).toBe('2026-10-11');expect(params.get('groupBy')).toBe('week');await page.getByText('How these figures are counted').click();await expect(page.getByText('Counts are not cohort conversion; rates may exceed 100%.')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('stylist location settings preserve fees and reject no offered locations',async({page},info)=>{
 await auth(page,'STYLER');await page.goto('/styler-dashboard/appointment-locations');await expect(page.getByRole('heading',{name:'Appointment locations',exact:true})).toBeVisible();await expect(page.getByLabel('Home-visit fee (CAD)')).toHaveValue('12.50');await page.getByLabel('At my salon or studio').uncheck();await page.getByLabel("At the customer's home").uncheck();await page.getByRole('button',{name:'Save appointment locations'}).click();await expect(page.getByRole('alert')).toContainText('Offer at least one appointment location.');await page.getByLabel("At the customer's home").check();await page.getByLabel('Maximum travel distance (km, optional)').fill('');
 const request=page.waitForRequest(r=>r.url().endsWith('/update_styler_travel_settings'));await page.getByRole('button',{name:'Save appointment locations'}).click();expect((await request).postDataJSON()).toEqual({offersSalonVisits:false,offersHomeVisits:true,maxTravelKm:null,includedTravelKm:20,baseTravelFee:'12.50'});await expect(page.getByText('Appointment locations saved.')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:info.outputPath('appointment-locations.png'),fullPage:true});
});
test('protected marketplace routes redirect before requesting restricted data',async({page})=>{
 const requests=[];page.on('request',r=>{if(/\/admin\/(service_areas|promo_codes|signup_funnel)/.test(r.url()))requests.push(r.url());});
 await page.goto('/admin/service-areas');await expect(page).toHaveURL(/admin\/login$/);await page.goto('/admin/promotions');await expect(page).toHaveURL(/admin\/login$/);await page.goto('/admin/signup-funnel');await expect(page).toHaveURL(/admin\/login$/);expect(requests).toEqual([]);await page.goto('/styler-dashboard/appointment-locations');await expect(page).toHaveURL(/\/login$/);
});
