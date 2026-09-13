import Hero from "./heroSection";
import Footer from "../../components/footer";
import { Link } from "react-router-dom";
import { curatedById } from "../../utils/curatedGallery";
import { GALLERY_CATEGORIES } from "../../utils/galleryCategories";

/**
 * Every photo on this page is our own reviewed work, taken from the curated
 * gallery list rather than a stock library — this page used to carry two
 * AI-generated portraits (`about-1.webp`, `about-2.jpg`). `curatedById` throws on
 * an unknown id, so renaming or dropping a photo fails the build instead of
 * shipping a hole where a face should be.
 */
const CORNROWS = curatedById("g-cornrows-1");
const NAIL_TECH = curatedById("g-nails-9");
const BARBER = curatedById("g-buzz-cut-1");

/**
 * What a visitor can actually book, one line per tab in the gallery. The list is
 * built from GALLERY_CATEGORIES so the two pages cannot drift apart: adding a tab
 * without adding a line here leaves a visible gap, which `aboutUs.test.js` fails
 * on rather than letting the page quietly fall behind the marketplace.
 */
const SERVICE_NOTES = {
  "Locs & dreadlocks": "Starter locs, retwists, faux and soft locs",
  "Buzz cut": "Clipper work, fades and line-ups",
  Braids: "Knotless, box braids, boho braids, twists",
  Cornrows: "Straight-backs, feed-ins and braided updos",
  Wigs: "Installs, revamps and wig construction",
  "High-top fade": "Fades, tapers and shape-ups",
  "Hair dye": "Colour, highlights and root touch-ups",
  "Nail tech": "Gel, acrylic, chrome and nail art",
  Makeup: "Soft glam, bridal and photo-ready looks",
  "Eyelash extensions": "Classic, hybrid, volume sets and fills",
  "Natural hair": "Silk press, twist-outs, deep conditioning",
};

const SERVICES = GALLERY_CATEGORIES.map((label) => ({ label, note: SERVICE_NOTES[label] }));

/**
 * The professional side of the marketplace, kept to things the platform really
 * does: professionals set their own services and durations, they see the
 * client's location and travel distance and accept or decline each request,
 * portfolios are capped at 30 photos, and a review can only follow a completed
 * booking. (See the stylist sign-up flow, AppConstants.MAX_STYLER_PORTFOLIO_IMAGES
 * and the FAQ answers.)
 */
const PRO_POINTS = [
  "Set your own services and prices, then accept or decline each request yourself",
  "See the client's area and travel distance before you decide",
  "Publish up to 30 photos of your work, reviewed before your profile goes live",
  "Reviews come from completed bookings only, so your rating means something",
];

const AboutUs = () => {
  document.title = "About us | RapidStylers";
  return (
    <div className="bg-white text-onSurface">
      {/* The hero is bottom-anchored, so it needs a floor as well as a share of the
          viewport — on a short screen 62vh alone would leave the statement clipped. */}
      <Hero height="clamp(560px, 62vh, 800px)" />

      {/* Who we are — statement and narrow body columns, beside our own work. */}
      <section className="mx-auto max-w-[1240px] px-5 py-20 md:px-[50px] md:py-28 lg:px-[100px]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Who we are</p>
            <h2 className="mt-6 text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.06] tracking-[-0.02em]">
              You pick the style and the time. A vetted professional takes the
              booking, <span className="text-[#B0B0B0]">and comes to you.</span>
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              <p className="max-w-[300px] text-[13px] leading-[1.55] text-black/60">
                RapidStylers is a Canadian booking platform for hair, nails and
                beauty. Search by service or by professional, look at their
                portfolio and reviews, and book from your phone.
              </p>
              <p className="max-w-[300px] text-[13px] leading-[1.55] text-black/60">
                Every professional is reviewed before their portfolio goes live,
                and they see your area and travel distance before accepting — so
                the person who turns up is expecting you.
              </p>
              <p className="max-w-[300px] text-[13px] leading-[1.55] text-black/60">
                A review can only be left after a completed booking, and it is
                read before it is published. No anonymous stars, no ratings from
                people who never sat in the chair.
              </p>
            </div>
          </div>

          <figure className="lg:col-span-5">
            <img
              src={CORNROWS.src}
              alt={CORNROWS.alt}
              className="aspect-[4/5] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">
              {CORNROWS.alt} — posted by a verified professional
            </figcaption>
          </figure>
        </div>
      </section>

      {/* What you can book — a hairline list of everything the gallery covers. */}
      <section className="bg-neutral">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-[50px] md:py-28 lg:px-[100px]">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted">What you can book</p>
              <h2 className="mt-6 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em]">
                Braids to barbering, booked the same way.
              </h2>
              <ul className="mt-10 grid gap-x-10 sm:grid-cols-2">
                {SERVICES.map(({ label, note }) => (
                  <li key={label} className="border-t border-black/10 py-4">
                    <p className="text-[15px]">{label}</p>
                    <p className="mt-1 text-[12px] leading-[1.5] text-black/50">{note}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-8 max-w-[420px] text-[12px] leading-[1.5] text-black/45">
                Whether anyone is free near you depends on the day — search shows
                who can take you, and what they charge, before you commit.
              </p>
            </div>

            <figure className="lg:col-span-5">
              <img
                src={NAIL_TECH.src}
                alt={NAIL_TECH.alt}
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">
                {NAIL_TECH.alt} — work from a RapidStylers professional
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* For professionals — the page's one inverted, full-bleed section. */}
      <section className="bg-[#0A0A0A] text-white">
        <div className="mx-auto max-w-[1240px] px-5 py-20 md:px-[50px] md:py-28 lg:px-[100px]">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                For beauty professionals
              </p>
              <h2 className="mt-6 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em]">
                Keep the clients.{" "}
                <span className="text-white/40">Lose the admin.</span>
              </h2>
              <ul className="mt-10">
                {PRO_POINTS.map((point) => (
                  <li
                    key={point}
                    className="border-t border-white/15 py-4 text-[13px] leading-[1.55] text-white/70"
                  >
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                to="/styler-signup"
                className="mt-10 inline-flex items-center rounded-full bg-brand px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Register as a beauty professional
              </Link>
              <p className="mt-4 text-[12px] text-white/40">
                Signing up takes a few minutes. You set your services after your
                account is reviewed.
              </p>
            </div>

            <figure className="lg:col-span-6">
              <img
                src={BARBER.src}
                alt={BARBER.alt}
                className="aspect-[4/5] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-white/40">
                {BARBER.alt} — posted by a verified professional
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Where this is going — short, factual, and it ends on the gallery. */}
      <section className="mx-auto max-w-[1240px] px-5 py-20 md:px-[50px] md:py-28 lg:px-[100px]">
        <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Where this is going</p>
        <h2 className="mt-6 max-w-[760px] text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.1] tracking-[-0.02em]">
          Everything here works in your browser today. The app is next.
        </h2>
        <p className="mt-6 max-w-[520px] text-[13px] leading-[1.55] text-black/60">
          A RapidStylers app is in the works for Android and iOS, so bookings and
          reminders can live on your phone. Nothing on this page waits for it.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            to="/elevate-your-looks"
            className="inline-flex items-center rounded-full bg-[#1A1A1A] px-7 py-3.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Browse the gallery
          </Link>
          <Link
            to="/contact-support"
            className="text-[13px] underline underline-offset-4 transition-colors hover:text-brand"
          >
            Ask us something
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
