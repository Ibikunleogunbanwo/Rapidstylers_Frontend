import { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";

const ContactSupport = () => {
  useEffect(() => {
    document.title = "Support | RapidStylers";
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

        <p className="text-xs uppercase tracking-[0.25em] text-brand font-bold">Support</p>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-3">
          We are here to help
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          Whether it is a question about a booking, a payment, or your account, we
          will get back to you as soon as we can. Most messages get a reply within
          one business day.
        </p>

        <div className="grid gap-4">
          <a
            href="mailto:support@rapidstylers.ca"
            className="rounded-2xl border border-gray-100 bg-[#faf9ff] p-6 hover:border-brand/60 hover:shadow-[0_8px_30px_rgba(147,129,255,0.18)] transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-11 w-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Email us</p>
                <p className="mt-1 text-sm text-gray-600">
                  Write to us at support@rapidstylers.ca and tell us what happened.
                </p>
              </div>
            </div>
          </a>

          <Link
            to="/faqs"
            className="rounded-2xl border border-gray-100 bg-[#faf9ff] p-6 hover:border-brand/60 hover:shadow-[0_8px_30px_rgba(147,129,255,0.18)] transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-11 w-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <circle cx="12" cy="17" r="0.5" fill="currentColor" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Check the FAQs</p>
                <p className="mt-1 text-sm text-gray-600">
                  Answers to the most common questions about booking, payments, and
                  getting started.
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/support"
            className="rounded-2xl border border-gray-100 bg-[#faf9ff] p-6 hover:border-brand/60 hover:shadow-[0_8px_30px_rgba(147,129,255,0.18)] transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 h-11 w-11 rounded-xl bg-brand/15 text-brand flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-gray-900">Submit a support ticket</p>
                <p className="mt-1 text-sm text-gray-600">
                  Sign in to your account to open a ticket and track our replies.
                  You can follow along with each update right from your dashboard.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactSupport;
