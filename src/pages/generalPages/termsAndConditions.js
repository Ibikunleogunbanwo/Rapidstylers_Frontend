import { useEffect } from "react";
import Footer from "../../components/footer";
import { Section, PageHeading, BackHome } from "../../components/pageSections";
import { SUPPORT_EMAIL } from "../../utils/constant";

const TermsAndConditions = () => {
  useEffect(() => {
    document.title = "Terms and Conditions | RapidStylers";
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Section pad="pt-10 md:pt-14 pb-6">
        <BackHome />
        <PageHeading
          eyebrow="Legal"
          title="Terms and Conditions"
          lead="Effective date: August 23, 2026"
        />

        <div className="max-w-[720px] space-y-10 text-[13px] leading-[1.7] text-black/65">
          <section>
            <h2 className="text-[15px] font-medium text-onSurface">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using the RapidStylers platform (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">2. Description of Service</h2>
            <p className="mt-2">
              RapidStylers is a marketplace that connects customers with independent beauty professionals ("Stylists") for in-home and on-location appointments. RapidStylers is not a party to the service agreement between customers and stylists.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">3. Eligibility</h2>
            <p className="mt-2">
              You must be at least 18 years old to use the Service. By creating an account, you represent that you meet this requirement and have the legal capacity to enter into a binding agreement.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">4. Account Registration</h2>
            <p className="mt-2">
              You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">5. Customer Obligations</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Provide accurate location and contact information for appointments.</li>
              <li>Be present at the scheduled time and location.</li>
              <li>Pay the agreed service fee through the platform.</li>
              <li>Treat stylists with respect and professionalism.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">6. Stylist Obligations</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Maintain accurate profile, availability, and service information.</li>
              <li>Arrive at the scheduled time and location.</li>
              <li>Provide services in a professional and workmanlike manner.</li>
              <li>Carry appropriate insurance for the services offered.</li>
              <li>Comply with all applicable laws and regulations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">7. Payments and Fees</h2>
            <p className="mt-2">
              Customers pay the service fee displayed at the time of booking. RapidStylers charges a platform commission on each completed transaction. Stylists receive payment minus the commission after the appointment is completed. All fees are displayed before confirmation.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">8. Cancellation Policy</h2>
            <p className="mt-2">
              Customers may cancel an appointment before the scheduled start time. Stylists may accept, decline, or complete appointments. Cancellation terms and any applicable fees are displayed at the time of booking.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">9. Reviews and Ratings</h2>
            <p className="mt-2">
              Reviews may only be submitted for completed appointments. Each booking may receive one review. Reviews must be honest and not contain abusive, defamatory, or misleading content. RapidStylers reserves the right to moderate or remove reviews that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">10. Privacy</h2>
            <p className="mt-2">
              Your use of the Service is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using the Service, you consent to the practices described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">11. Limitation of Liability</h2>
            <p className="mt-2">
              RapidStylers is not liable for any injury, loss, or damage arising from services provided by stylists. The platform facilitates connections but does not control the quality, safety, or legality of services. Users engage stylists at their own risk.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">12. Termination</h2>
            <p className="mt-2">
              RapidStylers may suspend or terminate your account at any time for violation of these terms. You may also delete your account at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">13. Changes to Terms</h2>
            <p className="mt-2">
              RapidStylers reserves the right to modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">14. Governing Law</h2>
            <p className="mt-2">
              These terms are governed by the laws of Canada and the applicable province. Any disputes shall be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">15. Contact</h2>
            <p className="mt-2">
              For questions about these terms, contact us at {SUPPORT_EMAIL}.
            </p>
          </section>
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
