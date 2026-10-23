import { useEffect, useState } from "react";
import Spinner from "../../components/spinner";
import { APIService } from "../../hooks/remote/apiService";
import { humanizeConnectReason, showErrorToastMessage } from "../../utils/constant";

const ALLOWED_ONBOARDING_HOSTS = ["connect.stripe.com", "connect.stripe.ca"];

const StylerPayouts = () => {
  const [payouts, setPayouts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const load = () => {
    setLoading(true);
    return APIService.getStylerPayouts()
      .then((response) => setPayouts(response.data?.data || null))
      .catch(() => setPayouts(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    document.title = "Payouts | RapidStylers";
    load();
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
        Could not load your payout summary. <button type="button" onClick={load}>Retry</button>
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

  // Compact zone tag for the payouts table ("Mountain", "Eastern"...) — the
  // long form would crowd a dense financial table.
  const zoneShort = (zone) => {
    try {
      const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortGeneric" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName");
      return (part && part.value) || "";
    } catch {
      return "";
    }
  };

  // One status panel for every state: a small coloured dot carries the state,
  // the rest stays in the app's neutral palette.
  const state = !payouts.connected
    ? {
        tone: "bg-amber-400",
        title: "Set up payouts to get paid",
        body: "Stripe collects your ID and bank details securely. RapidStylers never stores them.",
        action: connecting ? "Opening Stripe..." : "Connect to get paid",
      }
    : payouts.status === "REJECTED"
    ? {
        tone: "bg-red-500",
        title: "Payout setup needs attention",
        body: (
          <>
            Stripe could not verify your payout account: <span className="text-onSurface">{humanizeConnectReason(payouts.disabledReason)}</span>.
            {" "}Select Reconnect to re-enter your details. No new account is created, and your earnings stay safe until it's sorted.
          </>
        ),
        action: connecting ? "Opening Stripe..." : "Reconnect",
      }
    : payouts.status === "COMPLETE"
    ? {
        tone: "bg-emerald-500",
        title: "Ready for payouts",
        body: "Your share of each completed appointment is sent to your Stripe account on Stripe's payout schedule.",
        action: null,
      }
    : {
        tone: "bg-amber-400",
        title: "Payout setup in progress",
        body: "Finish the remaining steps in Stripe to start receiving your earnings.",
        action: connecting ? "Opening Stripe..." : "Continue setup",
      };

  return (
    <div className="bg-white rounded-lg border">
      {/* Payouts is a top-level section, so no back chevron: it looked like a link and did nothing. */}
      <div className="border-b border-black/10 p-4 text-[11px] uppercase tracking-[0.25em] text-muted bg-white rounded-t-lg">
        <span>Payouts</span>
      </div>

      <div className="p-6 grid gap-8">
        <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Payout status">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[15px] text-onSurface">
              <span className={`h-2 w-2 shrink-0 rounded-full ${state.tone}`} aria-hidden="true" />
              {state.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-black/55">{state.body}</p>
          </div>
          {state.action && (
            <button
              type="button"
              onClick={startConnect}
              disabled={connecting}
              className="shrink-0 rounded-full bg-onSurface px-5 py-2.5 text-[13px] text-white transition-opacity hover:opacity-85 disabled:opacity-60"
            >
              {state.action}
            </button>
          )}
        </section>

        <section aria-label="Earnings">
          <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-black/10 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className={`p-5 ${index % 2 ? "border-l" : ""} ${index > 1 ? "border-t lg:border-t-0" : ""} ${index === 2 ? "lg:border-l" : ""} border-black/10`}
              >
                <dt className="text-xs text-black/45">{stat.label}</dt>
                <dd className="mt-2 text-[22px] tracking-[-0.01em] text-onSurface">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-label="Completed appointments">
          <p className="mb-3 text-[15px] text-onSurface">Completed appointments</p>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 py-10 text-center text-sm text-black/45">
              No paid appointments yet. Earnings appear here after appointments are completed.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-black/45">
                  <tr>
                    <th className="px-4 py-3 font-normal">Appointment</th>
                    <th className="px-4 py-3 font-normal">Date</th>
                    <th className="px-4 py-3 font-normal">Time</th>
                    <th className="px-4 py-3 text-right font-normal">Total</th>
                    <th className="px-4 py-3 text-right font-normal">Commission</th>
                    <th className="px-4 py-3 text-right font-normal">Your share</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.appointmentId} className="border-t border-black/10">
                      <td className="px-4 py-3 text-onSurface">{row.appointmentId}</td>
                      <td className="px-4 py-3 text-black/55">{row.date}</td>
                      <td className="px-4 py-3 text-black/55">
                        {row.arrivalTime}{row.timeZone ? ` (${zoneShort(row.timeZone)})` : ""}
                      </td>
                      <td className="px-4 py-3 text-right text-black/70">${row.total}</td>
                      <td className="px-4 py-3 text-right text-black/45">${row.commission}</td>
                      <td className="px-4 py-3 text-right text-onSurface">${row.stylerShare}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default StylerPayouts;
