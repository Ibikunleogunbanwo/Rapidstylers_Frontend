import { useEffect, useState } from 'react';
import { contentNewsletterApi as api } from './contentNewsletterApi';
export function usePublishedContent(key) {
 const [content,setContent]=useState(null);
 useEffect(()=>{let live=true;setContent(null);api.get('/site_content',{key}).then(data=>{if(live&&data?.content&&typeof data.content==='object')setContent(data.content);}).catch(()=>{});return()=>{live=false;};},[key]);
 return content;
}
