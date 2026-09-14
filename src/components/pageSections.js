/**
 * The About page introduced this site's design language, and every general page
 * except the home page follows it. This module holds the shared pieces so the
 * pages cannot drift apart:
 *
 *   - `PAGE_SHELL`  the 1240px column every section lives in
 *   - `Section`     a page band (optionally `muted` or `dark`) rendering the
 *                   eyebrow + statement-heading pair
 *   - `BackHome`    the small back link that clears the fixed header
 *   - `PageHeading` eyebrow + h1 + lead paragraph for document-style pages
 *   - `HairlineList` the border-top list rows used for services and points
 *   - `PhotoFigure` a curated photo with the standard credit caption
 *
 * The tokens come straight from the About page: generous vertical rhythm
 * (py-20/28), an 11px uppercase tracked eyebrow, `font-normal` display headings
 * with tight leading and tracking, hairline `border-black/10` dividers, and one
 * near-black full-bleed band per page at most. Home is deliberately excluded;
 * its layout stays as it was.
 */
import { Link } from "react-router-dom";
import { curatedById } from "../utils/curatedGallery";

export const PAGE_SHELL = "mx-auto max-w-[1240px] px-5 md:px-[50px] lg:px-[100px]";
const SECTION_RHYTHM = "py-20 md:py-28";

/** Every photo on a page carries the same credit line, so none is unclaimed. */
export const credit = (photo) =>
  `${photo.alt}. Posted by a verified professional on RapidStylers.`;

/**
 * A full-width band. `muted` gives the neutral grey section, `dark` the single
 * inverted near-black one; plain renders on white. Children sit in PAGE_SHELL
 * with the shared vertical rhythm, which `pad` can replace outright (used by
 * the centred 404 and error pages).
 */
export function Section({ muted = false, dark = false, className = "", children, id, pad }) {
  const surface = dark ? "bg-[#0A0A0A] text-white" : muted ? "bg-neutral" : "bg-white";
  return (
    <section id={id} className={`${surface} ${className}`}>
      <div className={`${PAGE_SHELL} ${pad || SECTION_RHYTHM}`}>{children}</div>
    </section>
  );
}

/** The 11px uppercase tracked label above a statement heading. */
export function Eyebrow({ children, dark = false, className = "" }) {
  return (
    <p
      className={`text-[11px] uppercase tracking-[0.25em] ${
        dark ? "text-white/45" : "text-muted"
      } ${className}`}
    >
      {children}
    </p>
  );
}

/** A display heading: font-normal, tight leading, slightly negative tracking. */
export function Statement({ children, dark = false, size = "md", className = "" }) {
  const sizes = {
    md: "text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1]",
    lg: "text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.06]",
  };
  return (
    <h2
      className={`mt-6 font-normal tracking-[-0.02em] ${sizes[size]} ${
        dark ? "text-white" : "text-onSurface"
      } ${className}`}
    >
      {children}
    </h2>
  );
}

/** Small back link that clears the fixed header on document-style pages. */
export function BackHome({ label = "Back home", to = "/" }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition-colors hover:text-brand"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
          clipRule="evenodd"
        />
      </svg>
      {label}
    </Link>
  );
}

/**
 * Eyebrow + h1 + lead paragraph for document-style pages (legal, support,
 * FAQs). `max` keeps the line length readable on wide screens.
 */
export function PageHeading({ eyebrow, title, lead, max = "max-w-[680px]" }) {
  return (
    <header className={`${max} mb-12`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1 className="mt-5 text-[clamp(2rem,4vw,2.75rem)] font-normal leading-[1.08] tracking-[-0.02em] text-onSurface">
        {title}
      </h1>
      {lead && (
        <p className="mt-5 text-[14px] leading-[1.6] text-black/60">{lead}</p>
      )}
    </header>
  );
}

/** The border-top list rows the About page uses for services and pro points. */
export function HairlineList({ items, dark = false, columns = 1, className = "" }) {
  const cols = columns === 2 ? "sm:grid-cols-2 gap-x-10" : "";
  return (
    <ul className={`mt-10 grid ${cols} ${className}`}>
      {items.map(({ key, title, note }) => (
        <li
          key={key}
          className={`border-t py-4 ${
            dark ? "border-white/15 text-white/70" : "border-black/10 text-onSurface"
          }`}
        >
          {title && <p className="text-[15px] text-inherit">{title}</p>}
          <p
            className={`text-[13px] leading-[1.55] ${title ? "mt-1" : ""} ${
              dark ? "text-white/60" : "text-black/55"
            }`}
          >
            {note}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** A curated gallery photo with the standard uppercase credit caption. */
export function PhotoFigure({ id, ratio = "aspect-[4/5]" }) {
  const photo = curatedById(id);
  return (
    <figure>
      <img
        src={photo.src}
        alt={photo.alt}
        className={`${ratio} w-full object-cover`}
        loading="lazy"
        decoding="async"
      />
      <figcaption className="mt-3 text-[11px] uppercase tracking-[0.15em] text-muted">
        {credit(photo)}
      </figcaption>
    </figure>
  );
}
