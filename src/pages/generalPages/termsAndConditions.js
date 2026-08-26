import { useEffect } from "react";
import { Link } from "react-router-dom";

const TermsAndConditions = () => {
  useEffect(() => {
    document.title = "Terms and Conditions | RapidStylers";
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
          Terms and Conditions
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Effective date: August 23, 2026
        </p>

        <div className="prose prose-gray max-w-none text-sm leading-7 text-gray-700 space-y-6">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the RapidStylers platform (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. Description of Service</h2>
            <p>
              RapidStylers is a marketplace that connects customers with independent beauty professionals ("Stylists") for in-home and on-location appointments. RapidStylers is not a party to the service agreement between customers and stylists.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. Eligibility</h2>
            <p>
              You must be at least 18 years old to use the Service. By creating an account, you represent that you meet this requirement and have the legal capacity to enter into a binding agreement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. Account Registration</h2>
            <p>
              You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. Customer Obligations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate location and contact information for appointments.</li>
              <li>Be present at the scheduled time and location.</li>
              <li>Pay the agreed service fee through the platform.</li>
              <li>Treat stylists with respect and professionalism.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. Stylist Obligations</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintain accurate profile, availability, and service information.</li>
              <li>Arrive at the scheduled time and location.</li>
              <li>Provide services in a professional and workmanlike manner.</li>
              <li>Carry appropriate insurance for the services offered.</li>
              <li>Comply with all applicable laws and regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. Payments and Fees</h2>
            <p>
              Customers pay the service fee displayed at the time of booking. RapidStylers charges a platform commission on each completed transaction. Stylists receive payment minus the commission after the appointment is completed. All fees are displayed before confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. Cancellation Policy</h2>
            <p>
              Customers may cancel an appointment before the scheduled start time. Stylists may accept, decline, or complete appointments. Cancellation terms and any applicable fees are displayed at the time of booking.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. Reviews and Ratings</h2>
            <p>
              Reviews may only be submitted for completed appointments. Each booking may receive one review. Reviews must be honest and not contain abusive, defamatory, or misleading content. RapidStylers reserves the right to moderate or remove reviews that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you consent to the practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">11. Limitation of Liability</h2>
            <p>
              RapidStylers is not liable for any injury, loss, or damage arising from services provided by stylists. The platform facilitates connections but does not control the quality, safety, or legality of services. Users engage stylists at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">12. Termination</h2>
            <p>
              RapidStylers may suspend or terminate your account at any time for violation of these terms. You may also delete your account at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">13. Changes to Terms</h2>
            <p>
              RapidStylers reserves the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">14. Governing Law</h2>
            <p>
              These terms are governed by the laws of Canada and the applicable province. Any disputes shall be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">15. Contact</h2>
            <p>
              For questions about these terms, contact us at support@rapidstylers.ca.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
