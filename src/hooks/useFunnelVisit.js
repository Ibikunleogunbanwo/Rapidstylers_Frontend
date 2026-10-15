import { useEffect } from 'react';
import { ApiClient } from './remote/apiClient';
import Axios from 'axios';
import { API_HEADER } from '../utils/constant';
import { IS_DEMO, LIVE_API_BASE_URL } from '../utils/demo';
const STORAGE_KEY='rapidstylers-funnel-visitor';
let memoryId;
const attempted = new Set();
/**
 * Anonymous browser visit only: no URL, email, account ID or form values. Never interrupts navigation.
 * The demo's API is read-only, so demo visits are counted by the live API, where the funnel lives.
 */
export function recordFunnelVisit(demo=IS_DEMO){
  if(typeof window==='undefined'||!window.crypto?.randomUUID)return;
  let visitorId=memoryId;
  try{visitorId=window.localStorage.getItem(STORAGE_KEY)||visitorId;}catch{/* Storage may be blocked. */}
  if(!/^[A-Za-z0-9-]{8,64}$/.test(visitorId||''))visitorId=window.crypto.randomUUID();
  memoryId=visitorId;
  try{window.localStorage.setItem(STORAGE_KEY,visitorId);}catch{/* In-memory ID preserves deduplication. */}
  const day=new Date().toISOString().slice(0,10),key=`${day}:${visitorId}`;
  if(attempted.has(key))return;
  attempted.add(key);
  const sent=demo
    ? Axios.post(`${LIVE_API_BASE_URL}/funnel_visit`,{visitorId},{headers:API_HEADER,timeout:15_000})
    : ApiClient.post('/funnel_visit',{visitorId},{skipAuthRefresh:true,headers:{Authorization:undefined}});
  void sent.catch(()=>{});
}
export default function useFunnelVisit(){useEffect(()=>{recordFunnelVisit();},[]);}
