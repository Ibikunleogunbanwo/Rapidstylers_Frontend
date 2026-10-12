import { usePublishedContent } from "../../hooks/remote/usePublishedContent";
import PublicHeader from "../../components/publicHeader";
import { useEffect, useRef, useState } from "react";
import Footer from "../../components/footer";
import { Section, Eyebrow, PageHeading, BackHome, HairlineList } from "../../components/pageSections";

const FAQS = [
  {
    category: "For customers",
    q: "How do I book an appointment?",
    a: "Search for a beauty professional near you, pick the service you want, choose a time that suits you, and confirm your booking. The professional reviews your request, including your location and travel distance, then accepts or declines it. Once accepted, you are all set.",
  },
  {
    category: "For customers",
    q: "Do I need an account to book?",
    a: "Yes. Creating a free account lets you track your appointments, save professionals, and pay securely through the platform. You can sign up with your email (we verify it with a one-time code) or, as a customer, continue with Google. The Google path does not need a one-time code.",
  },
  {
    category: "For customers",
    q: "What does an appointment cost?",
    a: "The price is set by the professional and shown to you before you confirm. Some professionals charge an optional flat home-visit fee for travelling to you, which is also displayed upfront. There are no hidden per-kilometre charges, and you always see the exact total before confirming.",
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
    a: "You set the price for each service yourself, and you can also set an optional flat home-visit fee for travelling to clients. That fee is a single flat amount, not a per-kilometre charge. Clients see your prices (including the travel fee) before they book, so there are no surprises.",
  },
  {
    category: "For beauty professionals",
    q: "When and how do I get paid?",
    a: "After an appointment is completed, the payout is processed through Stripe Connect to your connected account on Stripe's standard payout schedule. Your Payouts dashboard shows every payout and its breakdown.",
  },
  {
    category: "For beauty professionals",
    q: "What fees does RapidStylers charge?",
    a: "Joining and listing your services is free. On each completed booking, a 12% platform commission plus Stripe's processing fees are deducted before the payout is sent to your connected account. The Payouts page shows the exact amounts.",
  },
  {
    category: "For beauty professionals",
    q: "What do I need to receive payouts?",
    a: "Connect your Stripe account through Stripe Connect onboarding in your Payouts page. Follow the steps Stripe asks for, and once your account is verified you can receive payouts.",
  },
  {
    category: "For beauty professionals",
    q: "Can I cancel an appointment I have accepted?",
    a: "Yes, with limits. Cancelling far in advance is fine, but a completed booking can only be cancelled within a short window after the appointment ends. After that it is treated as delivered. Any cancellation that has been paid for triggers an automatic refund, so clients are never left hanging.",
  },

  {
    category: "Accounts & security",
    q: "How do I sign in?",
    a: "Use the email and password you registered with. Customers who signed up with Google sign in with Google. The two methods are tied to your account, so choose the one you registered with.",
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
    a: "Use the Forgot password link on the sign-in page. We send a one-time code to your email; enter it, then set a new password. The code expires after a short time for your security. This covers customer accounts. If you signed up as a professional, contact support and we will change it for you.",
  },
];

// A section's deep-link id: lower-case ASCII words joined by hyphens, accents
// folded ("Réservation" -> "reservation"). The ids of the built-in sections are
// the targets the footer links to (/faqs#for-customers) and are pinned by the
// tests, so renaming those categories breaks links.
export const slugFor = (category) =>
  String(category || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "section";

/**
 * Groups FAQ items into one section per category, sections in the order their
 * category first appears and items in list order within each, however the list
 * interleaves them (General, Booking, General gives two sections, not three).
 * Every section gets a distinct id even when different labels fold to the same
 * slug ("Booking" and "Booking!" become "booking" and "booking-2"), and every
 * item a key that stays put when other items change: its own id when the
 * published content has one, otherwise its place in the list.
 */
export const groupFaqSections = (items) => {
  const sections = [];
  const byCategory = new Map();
  const usedIds = new Set();
  (items || []).forEach((faq, index) => {
    const category = String(faq.category || "").trim() || "General";
    let section = byCategory.get(category);
    if (!section) {
      const base = slugFor(category);
      let id = base;
      for (let n = 2; usedIds.has(id); n += 1) id = `${base}-${n}`;
      usedIds.add(id);
      section = { category, id, items: [] };
      byCategory.set(category, section);
      sections.push(section);
    }
    const key = faq.id !== undefined && faq.id !== null && faq.id !== "" ? `faq-${faq.id}` : `faq-at-${index}`;
    section.items.push({ ...faq, category, index, key });
  });
  return sections;
};

// Scrolls to the section named in the URL hash, if it is on the page. Returns
// whether it found one.
const scrollToHashTarget = () => {
  const raw = window.location.hash.slice(1);
  if (!raw) return false;
  let id = raw;
  try {
    id = decodeURIComponent(raw);
  } catch (error) {
    // A malformed escape is looked up as written.
  }
  const el = document.getElementById(id);
  if (!el) return false;
  // Small delay so layout settles after the accordion mounts.
  setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  return true;
};

const Faqs = () => {
  const published = usePublishedContent("faq");
  const [openIndex, setOpenIndex] = useState(0);
  // The hash already scrolled to, so content arriving later does not yank the
  // page back to it, while a hash whose section is not on the page yet (the
  // published list is still loading) is tried again once it is.
  const scrolledTo = useRef(null);

  useEffect(() => {
    document.title = "FAQs | RapidStylers";
    // Deep-link support: /faqs#for-customers scrolls to that section (initial
    // loads and same-page hash changes); with no hash, start at the top.
    if (!window.location.hash) window.scrollTo(0, 0);
    const onHashChange = () => {
      scrolledTo.current = scrollToHashTarget() ? window.location.hash : null;
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const items = published?.items?.map(item => ({id:item.id, q:item.question, a:item.answer, category:item.category || "General"})) || FAQS;
  const sections = groupFaqSections(items);
  const sectionIds = sections.map((section) => section.id).join(" ");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || scrolledTo.current === hash) return;
    if (scrollToHashTarget()) scrolledTo.current = hash;
  }, [sectionIds]);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader spacer />
      <Section pad="pt-10 md:pt-14 pb-4">
        <BackHome />
        <PageHeading
          eyebrow="FAQs"
          title="Questions? We have answers"
          lead={
            <>
              Everything you need to know about booking, pricing, payouts, and
              getting started, whether you are a client or a beauty professional.
              Still curious? Reach out through our support page.
            </>
          }
        />
      </Section>

      {sections.map(({ category, id, items }, sectionIndex) => (
        // The intro already closes with its own margin, so the first section
        // starts close under it rather than a full section's rhythm below.
        <Section
          key={id}
          muted={sectionIndex % 2 === 1}
          id={id}
          pad={sectionIndex === 0 ? "pt-4 md:pt-6 pb-20 md:pb-28" : undefined}
        >
          <Eyebrow className="scroll-mt-8">{category}</Eyebrow>
          <div className="mt-8 max-w-[860px]">
            {items.map((faq) => {
              const isOpen = openIndex === faq.index;
              return (
                <div key={faq.key} className="border-t border-black/10">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : faq.index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left"
                  >
                    <span className="text-[15px] font-medium text-onSurface">{faq.q}</span>
                    <svg
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                      className={`h-4 w-4 shrink-0 text-black/40 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <p className="max-w-[720px] pb-6 text-[13px] leading-[1.65] text-black/60">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      ))}

      <Section>
        <Eyebrow>Still have a question</Eyebrow>
        <HairlineList
          className="max-w-[680px]"
          items={[
            {
              key: "support",
              title: "Ask us directly",
              note: "The support page has our email and phone, and most messages get a reply within one business day.",
            },
          ]}
        />
        <a
          href="/contact-support"
          className="mt-8 inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
        >
          Go to support
        </a>
      </Section>

      <Footer />
    </div>
  );
};

export default Faqs;
