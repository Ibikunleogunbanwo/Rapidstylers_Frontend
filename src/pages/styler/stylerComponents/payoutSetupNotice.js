import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { APIService } from "../../../hooks/remote/apiService";

/**
 * The one thing a professional with earnings cannot work out on their own.
 *
 * A booking pays the stylist once it is completed, but only if they have a
 * Stripe account that can receive payouts. Until then the platform holds the
 * money back, and nothing across the workspace said why: the stylist simply saw
 * no money arrive. This banner names the cause and points at the one page that
 * fixes it.
 *
 * It renders nothing while loading, nothing when the status cannot be read, and
 * nothing once setup is complete, so it can sit in the shell without becoming
 * furniture. The Payouts page already carries the full setup card, so the banner
 * stays out of the way there.
 */

const MESSAGES = {
  NOT_STARTED: {
    title: "Finish your payout setup to get paid",
    body: "Connect a Stripe account so we can send your share of completed appointments. Stripe collects your ID and bank details, and RapidStylers never stores them.",
  },
  PENDING: {
    title: "Your payout setup is not finished",
    body: "Complete the remaining steps in Stripe to start receiving your share of completed appointments.",
  },
  REJECTED: {
    title: "Your payout setup needs attention",
    body: "Stripe could not verify your payout account. Reconnect to re-enter your details so you can get paid.",
  },
};

const DEFAULT_MESSAGE = {
  title: "Finish your payout setup to get paid",
  body: "Connect a Stripe account to receive your share of completed appointments.",
};

const PayoutSetupNotice = () => {
  const { pathname } = useLocation();
  const [summary, setSummary] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    APIService.getStylerConnectStatus()
      .then((response) => setSummary(response.data?.data || null))
      .catch(() => setSummary(null))
      .finally(() => setLoaded(true));
  }, []);

  // Unknown state stays silent: a warning that might be wrong is worse than no
  // warning. A finished setup has nothing left to ask for.
  if (!loaded || !summary || !summary.status || summary.status === "COMPLETE") return null;
  if (pathname.startsWith("/styler-dashboard/payouts")) return null;

  const { title, body } = MESSAGES[summary.status] || DEFAULT_MESSAGE;
  const waiting = Number(summary.payoutsWaiting || 0);

  return (
    <div className="mx-4 mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-900">{title}</p>
      <p className="mt-1 max-w-[640px] text-[13px] leading-[1.6] text-amber-800">{body}</p>
      {waiting > 0 && (
        <p className="mt-1 text-[13px] font-medium text-amber-900">
          {summary.payoutsWaitingAmount || "Money"} is waiting for you across{" "}
          {waiting} completed appointment{waiting === 1 ? "" : "s"}.
        </p>
      )}
      <Link
        to="/styler-dashboard/payouts"
        className="mt-2 inline-block text-[13px] font-semibold text-amber-900 underline"
      >
        Go to Payouts
      </Link>
    </div>
  );
};

export default PayoutSetupNotice;
