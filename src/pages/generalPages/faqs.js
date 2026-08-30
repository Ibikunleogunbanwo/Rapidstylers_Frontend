import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";

const FAQS = [
  {
    category: "For customers",
    q: "How do I book an appointment?",
    a: "Search for a beauty professional near you, pick the service you want, choose a time that suits you, and confirm your booking. The professional reviews your request — including your location and travel distance — and accepts or declines it. Once accepted, you are all set.",
  },
  {
    category: "For customers",
    q: "Do I need an account to book?",
    a: "Yes. Creating a free account lets you track your appointments, save professionals, and pay securely through the platform. You can sign up with your email (we verify it with a one-time code) or, as a customer, continue with Google — no OTP needed on the Google path.",
  },
  {
    category: "For customers",
    q: "What does an appointment cost?",
    a: "The price is set by the professional and shown to you before you confirm. Some professionals charge an optional flat home-visit fee for travelling to you, which is also displayed upfront. There are no hidden per-kilometre charges — you always see the exact total before confirming.",
  },
  {
    category: "For customers",
    q: "How do payments work?",
    a: "You pay securely through Stripe when you book. Your card details are handled inside Stripe's secure checkout and are never stored on our servers. Booking is protected against double charges, so clicking confirm more than once can never charge you twice.",
  },
  {
    category: "For customers",
    q: "Can I cancel an appointment and get a refund?",
    a: "Yes. You can cancel an appointment before its scheduled start time from your dashboard, and your payment is refunded automatically. To reschedule, cancel and book a new time that suits you. If a professional cancels a completed booking, the refund is also processed automatically and its status shows on the booking.",
  },
  {
    category: "For customers",
    q: "How do reviews work?",
    a: "You can leave one review per completed booking from your dashboard. Reviews are reviewed before they are published so everyone's feedback stays fair and useful.",
  },
  {
    category: "For customers",
    q: "How do I find a professional?",
    a: "Search by service or by the professional's name, and narrow results by distance from your location. You can save professionals to come back to later, and browse their portfolios and reviews on their profile page.",
  },
  {
    category: "For customers",
    q: "What if something goes wrong with my appointment?",
    a: "Reach out through our support page and we will step in to help. Include the appointment number when you can, and we will sort it out as quickly as possible.",
  },

  {
    category: "For beauty professionals",
    q: "How do I become a beauty professional on RapidStylers?",
    a: "Click Register as a beauty professional, create your profile, add your services, photos and pricing, and set your availability. Once your account is set up, clients in your area can find and book you.",
  },
  {
    category: "For beauty professionals",
    q: "How do clients book me?",
    a: "Clients send you booking requests. Each request shows the service, the client's location and travel distance, so you can decide whether the drive is worth it before you accept or decline. You stay in control of your schedule and your radius.",
  },
  {
    category: "For beauty professionals",
    q: "How do I price my services?",
    a: "You set the price for each service yourself, and you can also set an optional flat home-visit fee for travelling to clients — the fee is a single flat amount, not a per-kilometre charge. Clients see your prices (including the travel fee) before they book, so there are no surprises.",
  },
  {
    category: "For beauty professionals",
    q: "When and how do I get paid?",
    a: "After an appointment is completed, the payout is processed through Stripe Connect to your connected account on Stripe's standard payout schedule. Your Payouts dashboard shows every payout and its breakdown.",
  },
  {
    category: "For beauty professionals",
    q: "What fees does RapidStylers charge?",
    a: "Joining and listing your services is free. On each completed booking, a 12% platform commission plus Stripe's processing fees are deducted before the payout is sent to your connected account — the Payouts page shows the exact amounts.",
  },
  {
    category: "For beauty professionals",
    q: "What do I need to receive payouts?",
    a: "Connect your Stripe account through Stripe Connect onboarding in your Payouts page. Follow the steps Stripe asks for, and once your account is verified you can receive payouts.",
  },
  {
    category: "For beauty professionals",
    q: "Can I cancel an appointment I have accepted?",
    a: "Yes, with limits. Cancelling far in advance is fine, but a completed booking can only be cancelled within a short window after the appointment ends — after that it is treated as delivered. Any cancellation that has been paid for triggers an automatic refund, so clients are never left hanging.",
  },

  {
    category: "Accounts & security",
    q: "How do I sign in?",
    a: "Use the email and password you registered with. Customers who signed up with Google sign in with Google — the two methods are tied to your account, so choose the one you registered with.",
  },
  {
    category: "Accounts & security",
    q: "I did not get my verification code. What should I do?",
    a: "Emails can take a minute or two to arrive. Use the resend link on the verification screen to request a new code, and check your spam folder. You can also paste the full code from your email in one go.",
  },
  {
    category: "Accounts & security",
    q: "How is my account protected?",
    a: "Passwords are stored hashed, sign-in uses short-lived tokens with automatic refresh, verification codes are one-time, and repeated failed attempts are rate-limited. Sessions end when you sign out, and you will be asked to sign in again after a period of inactivity.",
  },
  {
    category: "Accounts & security",
    q: "Forgot your password?",
    a: "Use the Forgot password link on the sign-in page. We send a one-time code to your email; enter it, then set a new password. The code expires after a short time for your security.",
  },
];

const Faqs = () => {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    document.title = "FAQs | RapidStylers";
    // Deep-link support: /faqs#for-customers scrolls to that section (handles
    // both initial loads and same-page hash changes), otherwise start at top.
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const el = document.getElementById(hash.slice(1));
        if (el) {
          // Small delay so layout settles after the accordion mounts.
          setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
          return true;
        }
      }
      window.scrollTo(0, 0);
      return false;
    };
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-brand transition-colors mb-8"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
              clipRule="evenodd"
            />
          </svg>
          Home
        </Link>

        <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">FAQs</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-3">
          Questions? We have answers
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Everything you need to know about booking, pricing, payouts, and getting
          started — whether you are a client or a beauty professional. Still curious?
          Reach out through our support page.
        </p>

        <div className="grid gap-3">
          {FAQS.map((faq, index) => {
            const isNewCategory =
              index === 0 || FAQS[index - 1].category !== faq.category;
            const isOpen = openIndex === index;
            return (
              <div key={faq.q}>
                {isNewCategory && (
                  <p
                    id={faq.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}
                    className="text-xs uppercase tracking-[0.2em] text-brand font-bold mt-8 mb-3 first:mt-0 scroll-mt-8"
                  >
                    {faq.category}
                  </p>
                )}
                <div className="rounded-xl border border-gray-100 bg-[#faf9ff] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-[15px] text-gray-900">{faq.q}</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`h-5 w-5 shrink-0 text-brand transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm leading-7 text-gray-600">{faq.a}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Faqs;
