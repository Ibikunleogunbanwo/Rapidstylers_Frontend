import { useEffect, useState } from 'react';
import { MarketplaceAPI } from '../hooks/remote/marketplaceApi';
export default function PublicServiceAreas(){
 const [data,setData]=useState(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;MarketplaceAPI.publicServiceAreas().then(d=>{if(typeof d?.restricted!=='boolean'||!Array.isArray(d?.areas))throw new Error('Invalid areas');if(active)setData(d);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[]);
 if(failed)return <p role="status" className="text-sm">Service-area information is unavailable. Search your city to check available professionals.</p>;
 if(!data)return null;
 if(!data.restricted)return <p className="text-sm">Availability depends on professionals in your area. Search your city to see who is available.</p>;
 return <section className="rounded border bg-white p-4"><h2 className="font-semibold">Current service areas</h2><ul>{data.areas.map(a=><li key={a.province}>{a.province}: {a.wholeProvince?'All cities':a.cities.join(', ')}</li>)}</ul><p className="text-sm mt-2">Only professionals in these areas can be booked. Home visits depend on each professional's travel range.</p></section>;
}
