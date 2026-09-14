/**
 * Shared shell for the auth screens (sign in, admin sign in, the two signup
 * wizards). The split keeps one side as the brand panel and gives the form a
 * single readable column; `AuthSplit` owns the layout so the pages cannot
 * drift, and `WizardSteps` renders the progress indicator in the design
 * language's eyebrow register.
 *
 * The doodle band (`bg-stylerDoodle`) is the existing brand asset; on the dark
 * overlay it sits behind a single statement line, matching the About hero's
 * "one statement carries the panel" approach.
 */
import { Link } from "react-router-dom";
import logo from "../assets/svg-icons/colouredLogo.svg";
import { Eyebrow } from "./pageSections";

/**
 * The two-panel auth layout. `panel` fills the brand side; `eyebrow` and
 * `statement` render over the overlay. Children form the right column.
 */
export function AuthSplit({ eyebrow, statement, children, wide = false }) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white lg:grid-cols-12">
      {/* Brand panel */}
      <div className="relative hidden h-screen overflow-hidden lg:col-span-7 lg:block">
        <div className="bg-stylerDoodle h-full w-full bg-repeat" />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 flex items-end">
          <div className="w-full px-14 pb-16 text-white">
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">{eyebrow}</p>
            )}
            <p className="mt-5 max-w-[520px] text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.12] tracking-[-0.02em]">
              {statement}
            </p>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="col-span-1 lg:col-span-5">
        <div
          className={`mx-auto flex min-h-screen w-full flex-col px-6 py-10 md:px-14 ${
            wide ? "max-w-none" : "max-w-[520px]"
          }`}
        >
          <Link to="/" aria-label="RapidStylers home" className="mb-10 inline-flex">
            <img src={logo} alt="" className="h-9" />
          </Link>
          <div className="my-auto">{children}</div>
          <div className="bg-stylerDoodle mt-10 h-24 w-full bg-repeat-x bg-bottom lg:hidden" />
        </div>
      </div>
    </div>
  );
}

/**
 * Wizard progress in the eyebrow register: "1 Personal / 2 Verify Email …"
 * with the completed and current steps carrying their state. `current` is
 * 0-based.
 */
export function WizardSteps({ steps, current }) {
  return (
    <ol className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Progress">
      {steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "now" : "todo";
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === "now" ? "step" : undefined}>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                state === "now"
                  ? "bg-brand text-white"
                  : state === "done"
                  ? "bg-black/10 text-black/60"
                  : "bg-black/5 text-black/35"
              }`}
            >
              {state === "done" ? "\u2713" : i + 1}
            </span>
            <span
              className={`text-[11px] uppercase tracking-[0.15em] ${
                state === "now" ? "text-onSurface" : "text-black/40"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The form-column heading pair (title + subline) used by every auth screen. */
export function AuthHeading({ title, sub }) {
  return (
    <header className="mb-8">
      <h1 className="text-[clamp(1.5rem,2.6vw,2rem)] font-normal leading-[1.12] tracking-[-0.02em] text-onSurface">
        {title}
      </h1>
      {sub && <p className="mt-2 text-[13px] leading-[1.55] text-black/55">{sub}</p>}
    </header>
  );
}

export { Eyebrow };
