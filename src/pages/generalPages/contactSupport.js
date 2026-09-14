import { useEffect } from "react";
import Footer from "../../components/footer";
import { Section, Eyebrow, PageHeading, BackHome } from "../../components/pageSections";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../../utils/constant";

/**
 * The four ways to reach us, on the shared design language. Every value comes
 * from the shared constants; publishing a retyped copy is how the site once
 * advertised a phone number that did not exist.
 */
const CONTACT_CARDS = [
  {
    key: "email",
    title: "Email us",
    href: `mailto:${SUPPORT_EMAIL}`,
    note: `Write to us at ${SUPPORT_EMAIL} and tell us what happened.`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
  {
    key: "call",
    title: "Call us",
    href: `tel:${SUPPORT_PHONE_TEL}`,
    note: `${SUPPORT_PHONE}, Monday to Friday.`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    key: "faqs",
    title: "Check the FAQs",
    href: "/faqs",
    isRoute: true,
    note: "Answers to the most common questions about booking, payments, and getting started.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    key: "ticket",
    title: "Submit a support ticket",
    href: "/support",
    isRoute: true,
    note: "Sign in to your account to open a ticket and track our replies. You can follow along with each update right from your dashboard.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
];

const ContactSupport = () => {
  useEffect(() => {
    document.title = "Support | RapidStylers";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Section pad="pt-32">
        <BackHome />
        <PageHeading
          eyebrow="Support"
          title="We are here to help"
          lead="Whether it is a question about a booking, a payment, or your account, we will get back to you as soon as we can. Most messages get a reply within one business day."
        />

        <div className="max-w-[720px]">
          {CONTACT_CARDS.map(({ key, title, note, icon, href, isRoute }) => {
            const Tag = isRoute ? "a" : "a";
            return (
              <Tag
                key={key}
                href={href}
                className="group grid grid-cols-[44px_1fr] items-start gap-5 border-t border-black/10 py-6 transition-colors first:border-t-0 hover:bg-black/[0.015]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  {icon}
                </span>
                <span>
                  <span className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-medium text-onSurface">{title}</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      className="h-4 w-4 text-black/25 transition-all group-hover:translate-x-0.5 group-hover:text-brand"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 10a.75.75 0 01.75-.75h10.638L10.94 5.29a.75.75 0 111.06-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 11-1.06-1.08l3.448-3.25H3.75A.75.75 0 013 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="mt-1 block text-[13px] leading-[1.55] text-black/55">{note}</span>
                </span>
              </Tag>
            );
          })}
        </div>
      </Section>

      <Section muted>
        <div className="max-w-[680px]">
          <Eyebrow>Before you write</Eyebrow>
          <p className="mt-5 text-[13px] leading-[1.65] text-black/60">
            The FAQs answer most questions in a minute or two, including how
            pricing works, when you are charged, and how refunds are handled.
          </p>
        </div>
      </Section>

      <Footer />
    </div>
  );
};

export default ContactSupport;
