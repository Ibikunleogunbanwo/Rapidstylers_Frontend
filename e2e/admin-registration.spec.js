const { test, expect } = require('@playwright/test');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async ({context})=>{
 await context.route('**/*', route=>{
  const url=new URL(route.request().url());
  if(url.origin==='http://127.0.0.1:4173')return route.continue();
  if(url.hostname==='api.cloudinary.com')return route.fulfill({json:{secure_url:'https://res.cloudinary.com/test/photo.png',public_id:'test-photo'}});
  if(url.origin!=='https://api.rapidstylers.ca')return route.abort();
  const path=url.pathname.split('/rapid_stylers')[1];let data=[];let extra={};
  if(path==='/admin_sign_in')extra={token:'functional-admin',refreshToken:'r'};
  if(path==='/list_service')data=[{id:7,serviceName:'Hairstylist'}];
  if(path==='/list_identification')data=[{id:2,name:'Passport'}];
  if(path==='/styler_verify_otp')data={uploadToken:'signup-test'};
  if(path==='/get_upload_signature' && route.request().headers().authorization !== 'Bearer signup-test')return route.fulfill({status:401,json:{message:'Missing upload pass'}});
  if(path==='/get_upload_signature')data={cloudName:'test',apiKey:'test',timestamp:1,signature:'test',allowedFormats:'png',maxFileSize:1024*1024};
  if(path==='/admin/kpis')data={customers:12};
  if(path==='/admin/settings/commission')data={commissionPercent:15};
  if(path==='/admin/support_tickets')data=[{id:'t1',subject:'Booking help',status:'OPEN',message:'Please check my booking'}];
  return route.fulfill({json:{statusCode:'200',data,...extra}});
 });
});

async function adminLogin(page){await page.goto('/admin/login');await page.getByLabel('Email address',{exact:true}).fill('admin@example.test');await page.getByLabel('Password',{exact:true}).fill('TestPassword123!');await page.getByRole('button',{name:'Sign In',exact:true}).click();await expect(page).toHaveURL(/\/admin\/categories$/);}
async function selectSection(page,label){const select=page.getByLabel('Operations section',{exact:true});if(await select.isVisible())await select.selectOption({label});else await page.getByRole('navigation',{name:'Operations sections'}).getByRole('button',{name:label,exact:true}).click();}

test('admin fixes: labeled edits, section recovery, ticket drafts, refund review and unavailable metrics',async({page},info)=>{
 await adminLogin(page);
 await page.getByRole('button',{name:'Edit',exact:true}).click();
 const edit=page.getByLabel('Category name',{exact:true}).last();await edit.fill('Hair');
 await page.route('**/update_service',r=>r.fulfill({status:500,json:{message:'Failed'}}));
 await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByRole('main').getByRole('alert')).toBeVisible();await expect(edit).toHaveValue('Hair');
 await page.goto('/admin/operations');await expect(page.getByText('12',{exact:true})).toBeVisible();await selectSection(page,'Support');
 await page.getByRole('button',{name:'Update ticket'}).click();await page.getByLabel('Ticket status').selectOption('RESOLVED');await page.getByLabel('Response to customer').fill('Booking checked');
 let ticket;await page.route('**/admin/update_support_ticket',r=>{ticket=r.request().postDataJSON();return r.fulfill({json:{statusCode:'200',data:{}}});});
 await page.getByRole('button',{name:'Save ticket'}).click();await expect.poll(()=>ticket).toEqual({ticketId:'t1',status:'RESOLVED',adminResponse:'Booking checked'});
 await selectSection(page,'Settings');await page.reload();await expect(page.getByLabel('Commission %')).toHaveValue('15');
 await page.screenshot({path:info.outputPath('admin-operations.png'),fullPage:true});
 await page.goto('/admin/payments');await page.getByLabel('Appointment id *',{exact:true}).fill('booking-test');await page.getByRole('button',{name:'Review refund',exact:true}).click();await expect(page.getByRole('region',{name:'Review refund'})).toContainText('booking-test');
 await page.getByLabel('Re-authenticate (admin password)',{exact:true}).fill('synthetic-password');await page.route('**/admin/refund',r=>r.fulfill({status:500,json:{message:'Failed'}}));await page.getByRole('button',{name:'Confirm refund',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Verify the payment status'})).toBeVisible();await expect(page.getByLabel('Re-authenticate (admin password)',{exact:true})).toHaveValue('');
 await page.route('**/admin/recovery_campaigns',r=>r.fulfill({status:500,json:{message:'Failed'}}));await page.goto('/admin/recovery');await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByText('Unavailable',{exact:true})).toHaveCount(6);
});

async function completeSignup(page){
 await page.goto('/styler-signup');await page.getByLabel('First name:',{exact:true}).fill('Ada');await page.getByLabel('Last name:',{exact:true}).fill('Jones');await page.getByLabel('Email address:',{exact:true}).fill('styler@example.test');await page.getByLabel('Phone number:',{exact:true}).fill('5875551234');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page).toHaveURL(/verify-email$/);
 for(let i=1;i<=6;i++)await page.getByLabel(`Code digit ${i}`,{exact:true}).fill(String(i));await page.getByRole('button',{name:'Verify',exact:true}).click();await expect(page).toHaveURL(/business-details$/);
 await page.getByText("I'm a Hairstylist",{exact:true}).click();await page.getByLabel('Business name:',{exact:true}).fill('Ada Salon');await page.getByRole('textbox',{name:'Address:',exact:true}).fill('123 Test Street');await page.getByLabel('City:',{exact:true}).fill('Calgary');await page.getByLabel('Province:',{exact:true}).fill('Alberta');await page.getByLabel('Postal code:',{exact:true}).fill('T2P 1J9');await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page).toHaveURL(/photos$/);
 await page.getByText('Passport',{exact:true}).click();await page.locator('input[type=file]').nth(0).setInputFiles({name:'profile.png',mimeType:'image/png',buffer:png});await page.locator('input[type=file]').nth(1).setInputFiles({name:'id.png',mimeType:'image/png',buffer:png});await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(page).toHaveURL(/secure-account$/);await page.reload();await expect(page.getByLabel('Set password:',{exact:true})).toBeVisible();await page.getByLabel('Set password:',{exact:true}).fill('TestPassword123!');await page.getByLabel('Confirm password:',{exact:true}).fill('TestPassword123!');await page.getByRole('checkbox').check();
}

test('stylist registration completes all five steps, restores photos and clears draft',async({page},info)=>{
 let payload;await page.route('**/create_styler',r=>{payload=r.request().postDataJSON();return r.fulfill({json:{statusCode:'200',data:{}}});});await completeSignup(page);await page.screenshot({path:info.outputPath('stylist-registration.png'),fullPage:true});await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page).toHaveURL(/\/login$/);expect(payload.serviceTypeId).toBe('7');expect(payload.identificationTypeId).toBe('2');expect(payload.agreeToTerms).toBe(true);expect(payload.profileImageUrl).toContain('cloudinary');
 expect(await page.evaluate(()=>Object.keys(sessionStorage).filter(key=>/Signup.*(draft|email|pass)/i.test(key)))).toEqual([]);
});

test('uncertain stylist registration preserves assets and prevents another create',async({page})=>{
 let attempts=0;await page.route('**/create_styler',r=>{attempts++;return r.abort('failed');});await completeSignup(page);await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'could not confirm'})).toBeVisible();await expect(page.getByRole('button',{name:'Create account',exact:true})).toBeDisabled();await page.reload();await expect(page.getByRole('button',{name:'Create account',exact:true})).toBeDisabled();await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();expect(attempts).toBe(1);
});

test('copied signup tab cannot restore the original tab photos',async({page})=>{
 await completeSignup(page);await page.goto('/styler-signup/photos');
 await expect(page.locator('img[src^="blob:"]')).toHaveCount(2);
 const popupPromise=page.waitForEvent('popup');await page.evaluate(()=>window.open('/styler-signup/photos'));const popup=await popupPromise;
 await expect(popup.getByLabel('Profile photo:',{exact:true})).toBeAttached();await expect(popup.locator('img[src^="blob:"]')).toHaveCount(0);
 await page.reload();await expect(page.locator('img[src^="blob:"]')).toHaveCount(2);
});
