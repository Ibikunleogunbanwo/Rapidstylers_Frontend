import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { ApiClient } from "../../../hooks/remote/apiClient";
import { getAuthToken, showSuccessToastMessage } from "../../../utils/constant";

// How points work today, from the backend's LoyaltyService. Points are not
// exchangeable yet, and the page says so rather than implying a value.
const HOW_POINTS_WORK = [
  "10 points for each appointment you complete.",
  "25 points when someone you referred completes their first appointment.",
  "Points are not yet redeemable for discounts. Your balance is kept for when rewards launch.",
];

const Loyalty = ({ setPageTitle }) => {
  const [account, setAccount] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const load = async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    try {
      const response = await APIService.getLoyaltyAccount();
      if (!response.data?.data) throw new Error("Invalid account");
      setAccount(response.data.data);
    } catch (error) { setLoadError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    setPageTitle("Loyalty");
    document.title = "Loyalty | RapidStylers";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageTitle]);

  const apply = async (event) => {
    event.preventDefault();
    if (!referralCode.trim() || applying) return;
    setErrorMsg("");
    setApplying(true);
    try {
      // The bare client, so a refused code is reported once, inline under the
      // field, rather than as a toast as well (APIService toasts every error).
      await ApiClient.post("/apply_referral", { referralCode: referralCode.trim() });
      setReferralCode("");
      showSuccessToastMessage("Referral applied");
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error?.message || "Failed to apply referral");
    } finally {
      setApplying(false);
    }
  };

  const copyCode = async () => {
    const code = account?.referralCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Loyalty and referrals</h1>
            <p className="mt-0.5 text-xs text-gray-500">Earn points and share your code</p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 p-4">
        {!getAuthToken() ? <p className="text-sm text-gray-500">Please sign in to view loyalty benefits.</p> : loading ? <p className="text-sm text-gray-500">Loading loyalty account...</p> : loadError ? <div role="alert">Unable to load loyalty account. <button type="button" onClick={load}>Retry</button></div> : <>
          <div className="rounded-lg bg-[#1d1d1d] p-5 text-white"><p className="text-sm text-white/60">Available points</p><p className="mt-1 text-4xl font-bold">{account?.points || 0}</p><p className="mt-2 text-xs text-white/60">Earn points when completed appointments are recorded.</p></div>
          <div className="rounded-md border border-gray-100 p-4"><p className="text-sm font-semibold">How points work</p><ul className="mt-2 grid gap-1.5 text-sm text-gray-600">{HOW_POINTS_WORK.map((line) => <li key={line} className="flex gap-2"><span aria-hidden="true" className="text-brand">•</span><span>{line}</span></li>)}</ul></div>
          <div className="rounded-md border border-gray-100 p-4"><p className="text-sm font-semibold">Your referral code</p><div className="mt-2 flex flex-wrap items-center gap-3"><p className="font-mono text-lg font-bold text-brand">{account?.referralCode || "Not available"}</p>{account?.referralCode && <button type="button" onClick={copyCode} className="rounded-md border border-brand/30 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5 focus-visible:outline-2 focus-visible:outline-brand">{copied ? "Copied" : "Copy code"}</button>}<span role="status" className="sr-only">{copied ? "Referral code copied" : ""}</span></div><p className="mt-1 text-xs text-gray-500">Share this code with someone new to RapidStylers. They enter it here under Loyalty after signing up, and you earn 25 points when they complete their first appointment.</p></div>
          <form onSubmit={apply} className="grid gap-3"><p className="text-sm font-semibold">Apply a referral code</p><div className="flex gap-2"><input aria-label="Apply a referral code" required value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="RS-XXXXXXXX" className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm uppercase outline-none focus:border-brand" /><button type="submit" disabled={applying} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{applying ? "Applying..." : "Apply"}</button></div>{errorMsg && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{errorMsg}</span>
              </div>
            )}</form>
        </>}
      </div>
    </div>
  );
};

export default Loyalty;
