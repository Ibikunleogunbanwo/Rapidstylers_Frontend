import { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | RapidStylers";
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

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-8">Effective date: August 26, 2026</p>

        <div className="prose prose-gray max-w-none text-sm leading-7 text-gray-700 space-y-6">
          <p>
            Your privacy matters to us. This page explains what information we
            collect when you use RapidStylers, why we collect it, and the choices
            you have. We keep things simple and we never sell your personal
            information.
          </p>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Information we collect</h2>
            <p>
              We collect the information you share with us directly. That includes
              your name, email address, phone number, location details, and payment
              information when you book an appointment. Beauty professionals also
              provide business details, service lists, and portfolio photos so
              clients can find them.
            </p>
            <p className="mt-3">
              We also collect basic technical information such as your device type,
              browser, and how you use the platform. This helps us keep the service
              fast, secure, and easy to use.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. How we use your information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To create and manage your account.</li>
              <li>To connect you with beauty professionals in your area.</li>
              <li>To process bookings and payments.</li>
              <li>To send appointment confirmations and updates.</li>
              <li>To keep the platform safe and prevent misuse.</li>
              <li>To improve our services and your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Payment details</h2>
            <p>
              Payments are processed through Stripe, a trusted payment provider.
              Your full card number is never stored on our servers. Stripe handles
              the sensitive card details and we only keep references needed to
              manage your bookings and refunds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Sharing your information</h2>
            <p>
              We only share your information when it is needed to provide the
              service. That means sharing booking details with the professional you
              booked, and sharing limited data with providers such as Stripe for
              payments and Resend for email delivery. We do not sell your data to
              anyone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Your choices</h2>
            <p>
              You can update your profile, change your password, and manage
              notification preferences from your account settings at any time. You
              can also ask us to delete your account and the information tied to it
              by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Cookies</h2>
            <p>
              We use cookies and similar tools to keep you signed in and to
              remember your preferences, such as your location. You can disable
              cookies in your browser, but some parts of the platform may not work
              as well without them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Protecting your information</h2>
            <p>
              We use industry standard safeguards to protect your data, including
              encryption in transit and secure storage. No method is perfect, but we
              work hard to keep your information safe and review our practices
              regularly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Children</h2>
            <p>
              RapidStylers is intended for people aged 18 and older. We do not
              knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Changes to this policy</h2>
            <p>
              If we update this policy, we will post the new version on this page
              and update the effective date. We will also let you know through the
              platform when a change is significant.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Contact us</h2>
            <p>
              Questions about your privacy? Reach us at support@rapidstylers.com
              and we will be happy to help.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
