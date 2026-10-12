import { useEffect, useRef, useState } from "react";
import { APIService } from "../hooks/remote/apiService";
import { getAuthToken } from "../utils/constant";

export default function BookingPromo({ subtotal, onChange }) {
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  const notify = useRef(onChange);
  notify.current = onChange;
  useEffect(() => {
    generation.current += 1;
    setQuote(null); setError(""); setBusy(false); notify.current(null);
    return () => { generation.current += 1; };
  }, [subtotal]);
  const invalidate = () => {
    generation.current += 1; setQuote(null); setError(""); setBusy(false); notify.current(null);
  };
  const apply = async () => {
    if (!getAuthToken()) { setError("Sign in before applying a promo code."); return; }
    const attempt = ++generation.current;
    setBusy(true); setError("");
    try {
      const response = await APIService.checkPromoCode({ code: code.trim(), subtotal: String(subtotal) });
      const body = response.data;
      if (String(body?.statusCode) !== "200" || !body.data?.code || !Number.isFinite(Number(body.data.total)) || Number(body.data.total) < 0) throw new Error(body?.message || "Could not validate this promo code.");
      if (attempt !== generation.current) return;
      setQuote(body.data); notify.current(body.data);
    } catch (failure) {
      if (attempt !== generation.current) return;
      setQuote(null); notify.current(null); setError(failure.response?.data?.message || failure.message || "Could not validate this promo code.");
    } finally { if (attempt === generation.current) setBusy(false); }
  };
  return <div className="grid gap-2">
    <label htmlFor="booking-promo" className="text-sm font-medium">Promo code (optional)</label>
    <div className="flex gap-2"><input id="booking-promo" value={code} maxLength={40} onChange={event => { invalidate(); setCode(event.target.value); }} className="min-w-0 flex-1 rounded-md border p-2 text-black" autoComplete="off" />
      <button type="button" disabled={busy || !code.trim() || subtotal == null} onClick={apply} className="rounded-md border px-3 disabled:opacity-50">{busy ? "Checking…" : "Apply"}</button></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {quote && <div className="text-sm"><p role="status">{quote.code}: −${Number(quote.discount).toFixed(2)} CAD</p><button type="button" onClick={() => { invalidate(); setCode(""); }} className="underline">Remove promo code</button><p>The discount is checked again when you book.</p></div>}
  </div>;
}
