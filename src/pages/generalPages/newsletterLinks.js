import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { contentNewsletterApi as api, requestMessage } from '../../hooks/remote/contentNewsletterApi';
function NewsletterLink({action}) {
 const [params]=useSearchParams();const [token]=useState(()=>params.get('token')||'');const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);const [error,setError]=useState('');const pending=useRef(false);const confirm=action==='confirm';
 useEffect(()=>{
   let meta=document.head.querySelector('meta[name="referrer"]');const existed=Boolean(meta);if(!meta){meta=document.createElement('meta');meta.name='referrer';document.head.appendChild(meta);}const before=meta.getAttribute('content');meta.setAttribute('content','no-referrer');
   return()=>{if(!existed)meta.remove();else if(before!==null)meta.setAttribute('content',before);else meta.removeAttribute('content');};
 },[]);
 async function submit(){if(pending.current||!token)return;pending.current=true;setBusy(true);setError('');try{await api.post(`/newsletter_${action}`,{token});setDone(true);window.history.replaceState(window.history.state,'',window.location.pathname);}catch(e){setError(requestMessage(e));}finally{pending.current=false;setBusy(false);}}
 return <main className="min-h-screen bg-gray-50 px-4 py-16"><section className="max-w-xl mx-auto bg-white border rounded-xl p-6 grid gap-4"><h1 className="text-2xl">{confirm?'Confirm newsletter subscription':'Unsubscribe from the newsletter'}</h1>{done?<p role="status">{confirm?'Your subscription is confirmed.':'You have been unsubscribed.'}</p>:!token?<p role="alert">This link is missing its token. Open the complete link from your email.</p>:<><p>{confirm?'Confirm that you want to receive RapidStylers news and offers.':'Stop receiving RapidStylers newsletters. Your appointment emails will continue.'}</p><button className="bg-brand text-white rounded px-4 py-3" disabled={busy} onClick={submit}>{busy?'Working…':confirm?'Confirm subscription':'Unsubscribe'}</button></>}{error&&<p role="alert">{error} {confirm?'If you already confirmed this link, your subscription may already be active. Otherwise, request a new confirmation email from the subscription form.':'Try the unsubscribe link in your most recent newsletter. If it still fails, contact support. If you already unsubscribed, no further action is needed.'}</p>}<Link to="/" className="underline">Return home</Link></section></main>;
}
export const NewsletterConfirm = () => <NewsletterLink action="confirm"/>;
export const NewsletterUnsubscribe = () => <NewsletterLink action="unsubscribe"/>;
