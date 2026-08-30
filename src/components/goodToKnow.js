import { Link } from "react-router-dom";

// Key pricing / cancellation answers mirrored from the FAQ so customers and
// professionals see them where they actually book and get paid, not only on
// the FAQ page. Keep in sync with src/pages/generalPages/faqs.js.
const ITEMS = {
  styler: [
    "You set your own service prices and can add an optional flat home-visit fee for travelling to clients — not a per-kilometre charge.",
    "On each completed booking, a 12% platform commission plus Stripe processing fees are deducted before your payout.",
    "Payouts go to your connected Stripe account after an appointment is completed.",
    "You review every request — including the client's distance — before accepting, and a completed booking can only be cancelled within a short window after it ends, refunding the client automatically.",
  ],
  customer: [
    "Prices are set by the professional and shown before you confirm — some add a flat home-visit fee, with no hidden per-kilometre charges.",
    "Cancel before the appointment starts and your payment is refunded automatically; the refund status shows right on the booking.",
    "You can leave one review per completed booking.",
  ],
};

const FAQ_HASH = {
  styler: "#for-beauty-professionals",
  customer: "#for-customers",
};

const GoodToKnow = ({ variant = "customer" }) => {
  const items = ITEMS[variant] || ITEMS.customer;
  return (
    <div className="rounded-2xl border border-[#1d1d1d0a] bg-[#faf9ff] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">Good to know</p>
        <Link
          to={`/faqs${FAQ_HASH[variant] || ""}`}
          className="shrink-0 text-xs font-semibold text-brand hover:underline"
        >
          Read the FAQ
        </Link>
      </div>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-5 text-gray-600">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 shrink-0 text-brand mt-0.5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoodToKnow;
