import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken, isAdminRole } from '../../utils/constant';
import { requestError } from '../../hooks/remote/marketplaceApi';
export const AdminAccess = ({children}) => getAuthToken() && isAdminRole() ? children : <Navigate to="/admin/login" replace/>;
export const Field = ({label, children}) => <label className="grid gap-1 text-sm font-semibold text-gray-800">{label}{children}</label>;
export const inputClass = 'rounded border border-gray-400 px-3 py-2 font-normal w-full';
export const buttonClass = 'rounded bg-brand px-4 py-2 text-white disabled:opacity-50';
export function useAdminRead(load) {
  const [data,setData] = useState(null), [error,setError] = useState(''), [loading,setLoading] = useState(false);
  const generation = useRef(0);
  const refresh = async () => {
    const id = ++generation.current; setLoading(true); setError('');
    try { const result = await load(); if (id === generation.current) setData(result); }
    catch (err) { if (id === generation.current) { setError(requestError(err)); setData(null); } }
    finally { if (id === generation.current) setLoading(false); }
  };
  useEffect(() => { refresh(); return () => { generation.current++; }; }, []); // Initial read; filters explicitly apply.
  return {data,error,loading,refresh};
}
export const ReadState = ({loading,error,refresh}) => <>{loading && <p role="status">Loading…</p>}{error && <div role="alert" className="text-red-700">{error} <button onClick={refresh} className="underline">Retry</button></div>}</>;
