import { useEffect, useState } from "react";
import Back from "../../components/goBack";
import Spinner from "../../components/spinner";
import { APIService } from "../../hooks/remote/apiService";
import { humanizeConnectReason, showErrorToastMessage } from "../../utils/constant";

const ALLOWED_ONBOARDING_HOSTS = ["connect.stripe.com", "connect.stripe.ca"];

const StylerPayouts = () => {
  const [payouts, setPayouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    document.title = "Payouts | RapidStylers";
    APIService.getStylerPayouts()
      .then((response) => setPayouts(response.data?.data || null))
      .catch(() => setPayouts(null))
      .finally(() => setLoading(false));
  }, []);

  const startConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const dashboardUrl = `${window.location.origin}/styler-dashboard`;
      const { data } = await APIService.createStylerConnectAccount({
        returnUrl: `${dashboardUrl}/payouts?connect=done`,
        refreshUrl: `${dashboardUrl}/payouts`,
      });
      if (data?.statusCode !== "200" || !data?.data?.onboardingUrl) {
        // The backend answers HTTP 200 with the error in the body (no
        // exception thrown), so surface it explicitly instead of failing silent.
        showErrorToastMessage(data?.message || "Could not start Stripe Connect. Please try again.");
        return;
      }
      const onboardingUrl = new URL(data.data.onboardingUrl);
      if (!ALLOWED_ONBOARDING_HOSTS.includes(onboardingUrl.hostname)) {
        showErrorToastMessage("Invalid onboarding URL. Please try again.");
        return;
      }
      window.location.href = data.data.onboardingUrl;
    } catch (error) {
      showErrorToastMessage(error?.response?.data?.message || "Could not start Stripe Connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-10">
        <Spinner loading={loading} />
        <div className="text-center text-sm text-black/50">Loading your payouts...</div>
      </div>
    );
  }

  if (!payouts) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center text-sm text-black/50">
        Could not load your payout summary.
      </div>
    );
  }

  const stats = [
    { label: "Total earned", value: `$${payouts.totalEarned || "0.00"}` },
    { label: "Pending payout", value: `$${payouts.stripePending || "0.00"}` },
    { label: "Available now", value: `$${payouts.stripeAvailable || "0.00"}` },
    { label: "Platform commission", value: `$${payouts.totalCommission || "0.00"}` },
  ];

  const rows = Array.isArray(payouts.appointments) ? payouts.appointments : [];

  return (
    <div className="bg-white rounded-lg border">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Payouts</span>
      </div>

      <div className="p-6">
        {!payouts.connected ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 mb-6">
            <p className="font-semibold">Connect a Stripe account to receive payouts</p>
            <p className="mt-1 text-amber-700/80">
              Your ID and bank details are collected securely by Stripe — RapidStylers never stores them.
            </p>
            <button
              type="button"
              onClick={startConnect}
              disabled={connecting}
              className="mt-3 text-xs bg-brand text-white rounded-md px-4 py-2"
            >
              {connecting ? "Opening Stripe..." : "Connect to get paid"}
            </button>
          </div>
        ) : payouts.status === "REJECTED" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold flex items-center gap-2">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-red-600" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                  Payout setup needs attention
                </p>
                <p className="mt-1 text-red-700/80">
                  Stripe could not verify your payout account: <span className="font-medium">{humanizeConnectReason(payouts.disabledReason)}</span>.
                </p>
                <p className="mt-1 text-red-700/70">
                  Reconnect below to re-enter your details — no new account is created, and your earnings stay safe until it's sorted.
                </p>
              </div>
              <button
                type="button"
                onClick={startConnect}
                disabled={connecting}
                className="text-xs bg-red-600 text-white rounded-md px-4 py-2 shrink-0 hover:bg-red-700"
              >
                {connecting ? "Opening Stripe..." : "Reconnect"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 mb-6 flex items-center justify-between">
            <div>
              <p className="font-semibold">
                {payouts.status === "COMPLETE"
                  ? "Ready for payouts"
                  : "Payout setup in progress — complete onboarding in Stripe"}
              </p>
              <p className="mt-1 text-emerald-700/80">
                Your share of completed appointments is paid to your connected Stripe account on Stripe's payout schedule.
              </p>
            </div>
            {payouts.status !== "COMPLETE" && (
              <button type="button" onClick={startConnect} disabled={connecting} className="text-xs bg-brand text-white rounded-md px-4 py-2 shrink-0">
                {connecting ? "Opening Stripe..." : "Continue setup"}
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-black/10 bg-[#fafafa] p-4">
              <p className="text-xs uppercase tracking-wide text-black/40">{stat.label}</p>
              <p className="mt-2 text-xl font-bold text-brand">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <p className="text-sm font-semibold mb-3">Completed appointments</p>
          {rows.length === 0 ? (
            <div className="text-sm text-black/40 py-6 text-center border border-dashed rounded-lg">
              No paid appointments yet — earnings appear here after appointments are completed.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[#1d1d1d08] text-left text-xs uppercase tracking-wide text-black/50">
                  <tr>
                    <th className="px-4 py-3">Appointment</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Commission</th>
                    <th className="px-4 py-3 text-right">Your share</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.appointmentId} className="border-t">
                      <td className="px-4 py-3 font-medium">{row.appointmentId}</td>
                      <td className="px-4 py-3 text-black/60">{row.date}</td>
                      <td className="px-4 py-3 text-black/60">{row.arrivalTime}</td>
                      <td className="px-4 py-3 text-right">${row.total}</td>
                      <td className="px-4 py-3 text-right text-black/50">${row.commission}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">${row.stylerShare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StylerPayouts;
