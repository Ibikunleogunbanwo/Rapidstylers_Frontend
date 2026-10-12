import { render,waitFor,cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi,it,expect,afterEach,beforeEach } from 'vitest';
import PublishedSeo from './publishedSeo';
import { contentNewsletterApi as api } from '../hooks/remote/contentNewsletterApi';
vi.mock('../hooks/remote/contentNewsletterApi',()=>({contentNewsletterApi:{get:vi.fn(),post:vi.fn()},requestMessage:e=>e.message}));
beforeEach(()=>{vi.clearAllMocks();document.title='Default';api.get.mockResolvedValue({'/':{title:'Public title',description:'Published description',noindex:false},'/admin/content':{title:'Unsafe title',noindex:false},'/newsletter/confirm':{title:'Unsafe token title',noindex:false}});});
afterEach(()=>{cleanup();document.querySelectorAll('meta[name="robots"],meta[name="description"],meta[property^="og:"]').forEach(m=>m.remove());});
it('applies published SEO on public pages and cleans up',async()=>{const view=render(<MemoryRouter><PublishedSeo/></MemoryRouter>);await waitFor(()=>expect(document.title).toBe('Public title'));expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content','index, follow');view.unmount();expect(document.title).toBe('Default');expect(document.querySelector('meta[name="description"]')).toBeNull();});
it.each(['/admin/content','/newsletter/confirm','/accountSettings','/styler-dashboard','/login','/styler-signup'])('never lets content index protected route %s',async path=>{render(<MemoryRouter initialEntries={[path]}><PublishedSeo/></MemoryRouter>);await waitFor(()=>expect(api.get).toHaveBeenCalled());expect(document.title).toBe('Default');expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content','noindex, nofollow');});
it('points the canonical link at the page and gives fixed pages their own description',async()=>{const canonical=document.createElement('link');canonical.setAttribute('rel','canonical');canonical.setAttribute('href','https://www.rapidstylers.ca/');document.head.appendChild(canonical);const view=render(<MemoryRouter initialEntries={['/faqs']}><PublishedSeo/></MemoryRouter>);await waitFor(()=>expect(api.get).toHaveBeenCalled());expect(canonical.getAttribute('href')).toBe('https://www.rapidstylers.ca/faqs');expect(document.querySelector('meta[property="og:url"]')).toHaveAttribute('content','https://www.rapidstylers.ca/faqs');expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/questions/);view.unmount();expect(canonical.getAttribute('href')).toBe('https://www.rapidstylers.ca/');canonical.remove();});
it('drops a page shell\'s own tags on boot, so other pages do not inherit them',async()=>{
  // As if the app booted from build/about/index.html and the visitor is now elsewhere.
  const tags=[['property','og:title','About us | RapidStylers'],['name','twitter:title','About us | RapidStylers'],['name','description','Why RapidStylers exists'],['property','og:url','https://www.rapidstylers.ca/about']].map(([a,n,v])=>{const m=document.createElement('meta');m.setAttribute(a,n);m.setAttribute('content',v);document.head.appendChild(m);return m;});
  render(<MemoryRouter initialEntries={['/stylistProfile/a/b']}><PublishedSeo/></MemoryRouter>);
  await waitFor(()=>expect(api.get).toHaveBeenCalled());
  expect(tags.map(t=>t.getAttribute('content'))).toEqual(['RapidStylers','RapidStylers',expect.stringMatching(/^Find and book/),'https://www.rapidstylers.ca/stylistProfile/a/b']);
  cleanup();
  tags.forEach(t=>t.remove());
});
it('gives fixed pages their own og and twitter titles until one is published',async()=>{
  const view=render(<MemoryRouter initialEntries={['/about']}><PublishedSeo/></MemoryRouter>);
  await waitFor(()=>expect(api.get).toHaveBeenCalled());
  expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content','About us | RapidStylers');
  expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute('content','About us | RapidStylers');
  view.unmount();
  expect(document.querySelector('meta[property="og:title"]')).toBeNull();
  document.querySelectorAll('meta[name^="twitter:"]').forEach(m=>m.remove());
});
