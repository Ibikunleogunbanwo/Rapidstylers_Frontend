import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken } from "../../../utils/constant";

/**
 * The one thing a professional with earnings cannot work out on their own.
 *
 * A booking pays the stylist once it is completed, but only if they have a
 * Stripe account that can receive payouts. Until then the platform holds the
 * money back, and nothing across the workspace said why: the stylist simply saw
 * no money arrive. This banner names the cause and points at the one page that
 * fixes it.
 *
 * It renders nothing when the status cannot be read and nothing once setup is
 * complete, so it can sit in the shell without becoming furniture. The Payouts
 * page already carries the full setup card, so the banner stays out of the way
 * there.
 *
 * While the status loads it holds the banner's space with a neutral placeholder.
 * It used to render nothing until the read came back and then push the whole
 * dashboard down. The placeholder says nothing, so no warning flashes before we
 * know it is true. The last answer is kept for this sign-in (sessionStorage,
 * tied to the session's token), so moving around or reloading the dashboard
 * draws the right state at once and only the first visit waits.
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

export const PAYOUT_NOTICE_CACHE_KEY = "rapidstylers_payout_notice";

// The token's tail identifies this sign-in without copying the whole token.
const sessionTag = () => getAuthToken().slice(-24);

function readCachedSummary() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(PAYOUT_NOTICE_CACHE_KEY) || "null");
    const tag = sessionTag();
    return tag && cached && cached.tag === tag ? { summary: cached.summary || null } : null;
  } catch (_) {
    return null;
  }
}

function cacheSummary(summary) {
  try {
    const tag = sessionTag();
    if (tag) sessionStorage.setItem(PAYOUT_NOTICE_CACHE_KEY, JSON.stringify({ tag, summary }));
  } catch (_) {
    // Storage unavailable: the next visit waits for the read again.
  }
}

/** Same footprint as the banner, with no words: space held, nothing claimed. */
const NoticePlaceholder = () => (
  <div
    data-testid="payout-notice-placeholder"
    aria-hidden="true"
    className="mx-4 mt-4 rounded-lg border border-black/5 bg-black/[0.02] p-4"
  >
    <div className="h-5 w-64 max-w-full rounded bg-black/[0.06] animate-pulse" />
    <div className="mt-1 h-[42px] max-w-[640px] rounded bg-black/[0.04] animate-pulse" />
    <div className="mt-2 h-5 w-28 rounded bg-black/[0.06] animate-pulse" />
  </div>
);

const PayoutSetupNotice = () => {
  const { pathname } = useLocation();
  const [cached] = useState(readCachedSummary);
  const [summary, setSummary] = useState(cached ? cached.summary : null);
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    APIService.getStylerConnectStatus()
      .then((response) => {
        const next = response.data?.data || null;
        setSummary(next);
        cacheSummary(next);
      })
      .catch(() => setSummary(null))
      .finally(() => setLoaded(true));
  }, []);

  if (pathname.startsWith("/styler-dashboard/payouts")) return null;
  if (!loaded) return <NoticePlaceholder />;
  // Unknown state stays silent: a warning that might be wrong is worse than no
  // warning. A finished setup has nothing left to ask for.
  if (!summary || !summary.status || summary.status === "COMPLETE") return null;

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
