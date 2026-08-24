import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showSuccessToastMessage } from "../../../utils/constant";

const Loyalty = ({ setPageTitle }) => {
  const [account, setAccount] = useState(null);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setPageTitle("Loyalty");
    document.title = "Loyalty | RapidStylers";
    if (!getAuthToken()) { setLoading(false); return; }
    APIService.getLoyaltyAccount()
      .then((response) => setAccount(response.data?.data || null))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false));
  }, [setPageTitle]);

  const apply = async (event) => {
    event.preventDefault();
    if (!referralCode.trim() || applying) return;
    setErrorMsg("");
    setApplying(true);
    try {
      await APIService.applyReferral(referralCode.trim());
      setReferralCode("");
      showSuccessToastMessage("Referral applied");
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error?.message || "Failed to apply referral");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-1 border-b bg-[#1d1d1d08] p-4 text-[15px] font-bold"><Back /><span>Loyalty and referrals</span></div>
      <div className="grid gap-6 p-4">
        {!getAuthToken() ? <p className="text-sm text-gray-500">Please sign in to view loyalty benefits.</p> : loading ? <p className="text-sm text-gray-500">Loading loyalty account...</p> : <>
          <div className="rounded-lg bg-[#1d1d1d] p-5 text-white"><p className="text-sm text-white/60">Available points</p><p className="mt-1 text-4xl font-bold">{account?.points || 0}</p><p className="mt-2 text-xs text-white/60">Earn points when completed appointments are recorded.</p></div>
          <div className="rounded-md border border-gray-100 p-4"><p className="text-sm font-semibold">Your referral code</p><p className="mt-2 font-mono text-lg font-bold text-brand">{account?.referralCode || "Not available"}</p><p className="mt-1 text-xs text-gray-500">Share this code with a new customer.</p></div>
          <form onSubmit={apply} className="grid gap-3"><p className="text-sm font-semibold">Apply a referral code</p><div className="flex gap-2"><input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="RS-XXXXXXXX" className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm uppercase outline-none focus:border-brand" /><button type="submit" disabled={applying} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{applying ? "Applying..." : "Apply"}</button></div>{errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
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
