import { useEffect } from "react";
import Footer from "../../components/footer";
import { Section, PageHeading, BackHome } from "../../components/pageSections";
import { SUPPORT_EMAIL } from "../../utils/constant";

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | RapidStylers";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Section pad="pt-10 md:pt-14 pb-6">
        <BackHome />
        <PageHeading
          eyebrow="Legal"
          title="Privacy Policy"
          lead="Effective date: August 26, 2026"
        />

        <div className="max-w-[720px] space-y-10 text-[13px] leading-[1.7] text-black/65">
          <p>
            Your privacy matters to us. This page explains what information we
            collect when you use RapidStylers, why we collect it, and the choices
            you have. We keep things simple and we never sell your personal
            information.
          </p>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">1. Information we collect</h2>
            <p className="mt-2">
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
            <h2 className="text-[15px] font-medium text-onSurface">2. How we use your information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To create and manage your account.</li>
              <li>To connect you with beauty professionals in your area.</li>
              <li>To process bookings and payments.</li>
              <li>To send appointment confirmations and updates.</li>
              <li>To keep the platform safe and prevent misuse.</li>
              <li>To improve our services and your experience.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">3. Payment details</h2>
            <p className="mt-2">
              Payments are processed through Stripe, a trusted payment provider.
              Your full card number is never stored on our servers. Stripe handles
              the sensitive card details and we only keep references needed to
              manage your bookings and refunds.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">4. Sharing your information</h2>
            <p className="mt-2">
              We only share your information when it is needed to provide the
              service. That means sharing booking details with the professional you
              booked, and sharing limited data with providers such as Stripe for
              payments and Resend for email delivery. We do not sell your data to
              anyone.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">5. Your choices</h2>
            <p className="mt-2">
              You can update your profile, change your password, and manage
              notification preferences from your account settings at any time. You
              can also ask us to delete your account and the information tied to it
              by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">6. Cookies</h2>
            <p className="mt-2">
              We use cookies and similar tools to keep you signed in and to
              remember your preferences, such as your location. You can disable
              cookies in your browser, but some parts of the platform may not work
              as well without them.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">7. Protecting your information</h2>
            <p className="mt-2">
              We use industry standard safeguards to protect your data, including
              encryption in transit and secure storage. No method is perfect, but we
              work hard to keep your information safe and review our practices
              regularly.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">8. Children</h2>
            <p className="mt-2">
              RapidStylers is intended for people aged 18 and older. We do not
              knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">9. Changes to this policy</h2>
            <p className="mt-2">
              If we update this policy, we will post the new version on this page
              and update the effective date. We will also let you know through the
              platform when a change is significant.
            </p>
          </section>

          <section>
            <h2 className="text-[15px] font-medium text-onSurface">10. Contact us</h2>
            <p className="mt-2">
              Questions about your privacy? Reach us at {SUPPORT_EMAIL} and we will
              be happy to help.
            </p>
          </section>
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
