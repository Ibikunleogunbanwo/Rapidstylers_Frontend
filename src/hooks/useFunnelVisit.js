import { useEffect } from 'react';
import { ApiClient } from './remote/apiClient';
const STORAGE_KEY='rapidstylers-funnel-visitor';
let memoryId;
const attempted = new Set();
/** Anonymous browser visit only: no URL, email, account ID or form values. Never interrupts navigation. */
export function recordFunnelVisit(){
  if(typeof window==='undefined'||!window.crypto?.randomUUID)return;
  let visitorId=memoryId;
  try{visitorId=window.localStorage.getItem(STORAGE_KEY)||visitorId;}catch{/* Storage may be blocked. */}
  if(!/^[A-Za-z0-9-]{8,64}$/.test(visitorId||''))visitorId=window.crypto.randomUUID();
  memoryId=visitorId;
  try{window.localStorage.setItem(STORAGE_KEY,visitorId);}catch{/* In-memory ID preserves deduplication. */}
  const day=new Date().toISOString().slice(0,10),key=`${day}:${visitorId}`;
  if(attempted.has(key))return;
  attempted.add(key);
  void ApiClient.post('/funnel_visit',{visitorId},{skipAuthRefresh:true,headers:{Authorization:undefined}}).catch(()=>{});
}
export default function useFunnelVisit(){useEffect(()=>{recordFunnelVisit();},[]);}
