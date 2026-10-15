import { useEffect } from "react";
import PublicHeader from "../../components/publicHeader";
import Footer from "../../components/footer";
import { Section, PageHeading, BackHome } from "../../components/pageSections";
import { LEGAL_ENTITY, PRIVACY_EMAIL, SUPPORT_ADDRESS, SUPPORT_PHONE } from "../../utils/constant";

const h2 = "text-[15px] font-medium text-onSurface";

// Service providers that receive personal information, and why. Keep this list
// in step with the integrations the app actually uses.
const PROVIDERS = [
  ["Stripe", "card payments, refunds and stylist payouts"],
  ["Resend", "sending account, booking and newsletter emails"],
  ["Cloudinary", "storing profile, portfolio and ID photos"],
  ["Google", "Sign in with Google, address suggestions and maps"],
  ["Cloudflare", "protecting the site from abuse and bots"],
  ["Vercel", "hosting the website"],
];

// How long each kind of information is kept. Alberta's PIPA asks that personal
// information be kept only as long as reasonably needed, and at least one year
// after it is used to make a decision about someone.
const RETENTION = [
  ["Account details", "While your account is open. After you close it, deleted or anonymized within 90 days, except the records below that the law requires us to keep."],
  ["Bookings, payments, refunds and payouts", "Six years after the end of the tax year they relate to, as Canadian tax law requires."],
  ["Stylist ID photos", "While your application is reviewed and your stylist account is open, then one more year after the account closes or the application is declined. Then deleted."],
  ["Support messages", "Two years after the request is closed."],
  ["Newsletter sign-up", "Until you unsubscribe. After that we keep only your email address on a do-not-email list, so you are never emailed again."],
  ["Technical and security logs", "Only as long as needed to keep the service secure and fix problems."],
];

const PrivacyPolicy = () => {
  useEffect(() => {
    document.title = "Privacy Policy | RapidStylers";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader spacer />
      <Section pad="pt-10 md:pt-14 pb-6">
        <BackHome />
        <PageHeading
          eyebrow="Legal"
          title="Privacy Policy"
          lead="Effective date: October 15, 2026"
        />

        <div className="max-w-[720px] space-y-10 text-[13px] leading-[1.7] text-black/65">
          <p>
            RapidStylers is operated by {LEGAL_ENTITY}, based in Alberta, Canada
            ("we", "us"). This page explains what personal information we collect
            when you use RapidStylers, why we collect it, how long we keep it, and
            the choices you have. We handle personal information under Alberta's
            Personal Information Protection Act (PIPA) and, where it applies,
            Canada's Personal Information Protection and Electronic Documents Act
            (PIPEDA). We never sell your personal information.
          </p>

          <section>
            <h2 className={h2}>1. Information we collect</h2>
            <p className="mt-2">
              We collect the information you share with us directly. That includes
              your name, email address, phone number, location details, and payment
              information when you book an appointment. If you sign in with Google,
              Google shares your name and email address with us.
            </p>
            <p className="mt-3">
              Beauty professionals also provide business details, service lists,
              portfolio photos and payout details. To keep clients safe, stylists
              upload a photo of a government-issued ID so we can verify who they
              are before their profile goes live. ID photos are stored privately,
              are never shown on the site, and only our admin team can view them.
            </p>
            <p className="mt-3">
              We also collect basic technical information such as your device type,
              browser, and how you use the platform. This helps us keep the service
              fast, secure, and easy to use.
            </p>
          </section>

          <section>
            <h2 className={h2}>2. How we use your information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To create and manage your account.</li>
              <li>To verify stylists' identity before they can take bookings.</li>
              <li>To connect you with beauty professionals in your area.</li>
              <li>To process bookings, payments, refunds and payouts.</li>
              <li>To send appointment confirmations, reminders and updates.</li>
              <li>To send our newsletter, only if you asked for it.</li>
              <li>To keep the platform safe and prevent fraud or misuse.</li>
              <li>To improve our services and your experience.</li>
            </ul>
            <p className="mt-3">
              We collect and use your information only for these purposes, with
              your consent or as the law allows.
            </p>
          </section>

          <section>
            <h2 className={h2}>3. Payment details</h2>
            <p className="mt-2">
              Payments are processed through Stripe, a trusted payment provider.
              Your full card number is never stored on our servers. Stripe handles
              the sensitive card details and we only keep references needed to
              manage your bookings and refunds.
            </p>
          </section>

          <section>
            <h2 className={h2}>4. Sharing your information</h2>
            <p className="mt-2">
              We only share your information when it is needed to provide the
              service. Booking details are shared with the professional you booked
              (and the client's details with the stylist). We also use these
              service providers, who may only use your information to provide
              their service to us:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {PROVIDERS.map(([name, purpose]) => (
                <li key={name}><span className="text-onSurface">{name}</span>: {purpose}.</li>
              ))}
            </ul>
            <p className="mt-3">
              Some of these providers store or process information outside Canada,
              mainly in the United States, where it may be accessed by authorities
              under the laws of that country. To ask about our policies for service
              providers outside Canada, contact our Privacy Officer (section 11).
              We may also share information when the law requires it.
            </p>
          </section>

          <section>
            <h2 className={h2}>5. How long we keep it</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              {RETENTION.map(([what, how]) => (
                <li key={what}><span className="text-onSurface">{what}</span>: {how}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className={h2}>6. Your rights and choices</h2>
            <p className="mt-2">
              You can update your profile, change your password, and manage
              notification preferences from your account settings at any time. You
              can also ask us to:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>see the personal information we hold about you;</li>
              <li>correct information that is wrong;</li>
              <li>close your account and delete the information tied to it;</li>
              <li>withdraw a consent you gave, such as for the newsletter.</li>
            </ul>
            <p className="mt-3">
              Send your request to {PRIVACY_EMAIL}. We will answer within 30 days.
              If you are not satisfied with our answer, you can complain to the
              Office of the Information and Privacy Commissioner of Alberta
              (oipc.ab.ca) or the Office of the Privacy Commissioner of Canada
              (priv.gc.ca).
            </p>
          </section>

          <section>
            <h2 className={h2}>7. Emails we send</h2>
            <p className="mt-2">
              Account and booking emails (such as verification codes, booking
              confirmations, reminders and receipts) are part of the service and
              are always sent. Newsletter and offer emails are sent only if you
              opted in. Every newsletter has an unsubscribe link, and we act on
              unsubscribes right away.
            </p>
          </section>

          <section>
            <h2 className={h2}>8. Cookies</h2>
            <p className="mt-2">
              We use cookies and similar tools to keep you signed in and to
              remember your preferences, such as your location. You can disable
              cookies in your browser, but some parts of the platform may not work
              as well without them.
            </p>
          </section>

          <section>
            <h2 className={h2}>9. Protecting your information</h2>
            <p className="mt-2">
              We use industry standard safeguards to protect your data, including
              encryption in transit, encrypted storage of sensitive details, and
              limiting who on our team can see what. No method is perfect. If a
              breach ever creates a real risk of significant harm to you, we will
              tell you and the Privacy Commissioner as the law requires.
            </p>
          </section>

          <section>
            <h2 className={h2}>10. Children</h2>
            <p className="mt-2">
              RapidStylers is intended for people aged 18 and older. We do not
              knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className={h2}>11. Contact our Privacy Officer</h2>
            <p className="mt-2">
              Privacy Officer, {LEGAL_ENTITY}<br />
              {SUPPORT_ADDRESS}<br />
              Email: {PRIVACY_EMAIL}<br />
              Phone: {SUPPORT_PHONE}
            </p>
          </section>

          <section>
            <h2 className={h2}>12. Changes to this policy</h2>
            <p className="mt-2">
              If we update this policy, we will post the new version on this page
              and update the effective date. We will also let you know through the
              platform when a change is significant.
            </p>
          </section>
        </div>
      </Section>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
