import { Link } from "react-router-dom";

// Key pricing / cancellation answers mirrored from the FAQ so customers and
// professionals see them where they actually book and get paid, not only on
// the FAQ page. Keep in sync with src/pages/generalPages/faqs.js.
const ITEMS = {
  styler: [
    "You set your own prices, plus an optional flat home-visit fee if you travel to clients.",
    "Each completed booking pays out after the 12% platform commission and Stripe's processing fees.",
    "Payouts land in your connected Stripe account once the appointment is completed.",
    "You approve each request yourself, and you can see how far away the client is before you accept. After a booking ends there is a short window to cancel, and the client is refunded automatically.",
  ],
  customer: [
    "Professionals set their own prices, and you see the full amount before you confirm. Some add a flat fee for home visits.",
    "Cancel before the appointment starts and your payment is refunded automatically. The booking page shows the refund status.",
    "You can leave one review for each completed booking.",
  ],
};

const FAQ_HASH = {
  styler: "#for-beauty-professionals",
  customer: "#for-customers",
};

const GoodToKnow = ({ variant = "customer" }) => {
  const items = ITEMS[variant] || ITEMS.customer;
  return (
    <div className="rounded-lg border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Good to know</p>
        <Link
          to={`/faqs${FAQ_HASH[variant] || ""}`}
          className="shrink-0 text-[13px] font-semibold text-brand hover:underline"
        >
          Read the FAQ
        </Link>
      </div>
      <ul className="mt-1 grid">
        {items.map((item) => (
          <li key={item} className="border-t border-black/10 py-3 first:border-t-0 first:pt-3 mt-1 first:mt-2 text-[13px] leading-[1.55] text-black/55">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GoodToKnow;
