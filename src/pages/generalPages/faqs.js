import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";

const FAQS = [
  {
    q: "How do I book an appointment?",
    a: "Search for a beauty professional near you, pick the service you want, choose a time that suits you, and confirm your booking. The professional will accept your request and you are all set.",
  },
  {
    q: "Do I need to create an account to book?",
    a: "Yes. Creating a free account lets you track your appointments, message professionals, and pay securely through the platform.",
  },
  {
    q: "How do payments work?",
    a: "You pay securely through Stripe when you book. Your card details are handled by Stripe and are never stored on our servers. If a booking is cancelled, we process refunds according to the cancellation policy.",
  },
  {
    q: "Can I cancel or reschedule an appointment?",
    a: "Yes. You can cancel an appointment before the scheduled start time from your dashboard. To reschedule, cancel the booking and make a new one at a time that works better for you.",
  },
  {
    q: "What areas do you serve?",
    a: "We are growing across Canada. Choose your province and city from the location picker to see the professionals available in your area.",
  },
  {
    q: "How do I become a beauty professional on RapidStylers?",
    a: "Click Register as a beauty professional, create your profile, add your services and photos, and set your availability. Once your account is set up, clients in your area can find and book you.",
  },
  {
    q: "When do professionals get paid?",
    a: "After an appointment is completed, the payout is processed through Stripe Connect to the professional's connected account. The timeline follows Stripe's standard payout schedule.",
  },
  {
    q: "How do I leave a review?",
    a: "You can review a professional after your appointment is completed. Each booking gets one review, so your honest feedback stays fair and useful for everyone.",
  },
  {
    q: "What if something goes wrong with my appointment?",
    a: "Reach out through our support page and we will step in to help. Include the appointment number when you can, and we will sort it out as quickly as possible.",
  },
];

const Faqs = () => {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    document.title = "FAQs | RapidStylers";
    window.scrollTo(0, 0);
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
          Everything you need to know about booking, payments, and getting started.
          Still curious? Reach out through our support page.
        </p>

        <div className="grid gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-gray-100 bg-[#faf9ff] overflow-hidden"
              >
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
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Faqs;
