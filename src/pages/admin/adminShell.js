import { logoutSession } from "../../utils/sessionLogout";
/**
 * The shared chrome for the admin area. Every admin page used to duplicate the
 * same three pieces — the grey canvas, the heading + sign-out row, and the
 * section nav with the current page underlined — which is how they drifted
 * (different max-widths, different nav orders, one page with its own AdminNav
 * copy). They now all render through here so the area cannot drift again.
 *
 * The admin area keeps a quieter, denser register than the public design
 * language on purpose: it is a working tool, so it uses the same type scale
 * (font-normal display headings, tracked eyebrows) but on a compact grey
 * canvas with hairline cards instead of the public pages' editorial bands.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

/** The admin section nav. `current` is underlined; the rest stay quiet links. */
const ADMIN_GROUPS = [
  ["Overview", [["/admin", "Dashboard"]]],
  ["Marketplace", [["/admin/stylers", "Stylists"], ["/admin/stylers?section=images", "Gallery"], ["/admin/operations?section=reviews", "Reviews"]]],
  ["Catalog & content", [["/admin/categories", "Categories"], ["/admin/blog", "Blog"]]],
  ["Finance", [["/admin/payments", "Payments"], ["/admin/payments?section=disputes", "Disputes"], ["/admin/payments?section=unpaidPayouts", "Unpaid payouts"]]],
  ["Marketing", [["/admin/recovery", "Recovery"], ["/admin/announcements", "Announcements"]]],
  ["Platform", [["/admin/operations", "Operations"], ["/admin/operations?section=tickets", "Support"], ["/admin/operations?section=logs", "Audit log"]]],
];

export function AdminNav({ onNavigate } = {}) {
  const { pathname, search } = useLocation();
  return (
    <nav id="admin-navigation" aria-label="Admin sections" className="space-y-5 text-sm">
      {ADMIN_GROUPS.map(([group, links]) => <div key={group}>
        <p className="mb-2 text-xs font-semibold text-gray-500">{group}</p>
        <ul className="space-y-1">{links.map(([to, label]) => {
          const current = to === pathname + search || (!search && to === pathname);
          return <li key={to}><Link to={to} onClick={onNavigate} aria-current={current ? "page" : undefined} className={`block rounded-md px-3 py-2 font-medium focus-visible:outline-2 focus-visible:outline-brand ${current ? "bg-brand/10 text-brand underline underline-offset-4" : "text-gray-600 hover:bg-gray-100"}`}>{label}</Link></li>;
        })}</ul>
      </div>)}
    </nav>
  );
}

/** The sign-out button every page header carries. */
export function AdminSignOut() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        logoutSession();
        navigate("/admin/login", { replace: true });
      }}
      className="text-sm font-semibold text-gray-500 hover:text-gray-800"
    >
      Sign out
    </button>
  );
}

/**
 * The page shell: grey canvas, 1240px-ish column, display-register heading
 * with a tracked eyebrow, sign-out on the right, then the section nav.
 * `actions` (optional) renders extra buttons beside the sign-out (recovery's
 * Refresh), and `children` follow the nav.
 */
export function AdminPage({ eyebrow, title, actions, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#f5f5f5] lg:grid lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="border-b lg:border-b-0 lg:border-r border-black/10 bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/admin" className="font-semibold text-gray-900">RapidStylers <span className="block text-xs font-normal text-gray-500">Admin console</span></Link>
          <button type="button" className="rounded-md border px-3 py-2 text-sm lg:hidden" aria-expanded={menuOpen} aria-controls="admin-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "Close menu" : "Menu"}</button>
        </div>
        <div className={menuOpen ? "block" : "hidden lg:block"}><AdminNav onNavigate={() => setMenuOpen(false)} /></div>
      </aside>
      <div className="w-full min-w-0 px-4 py-6 md:px-8 md:py-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400">{eyebrow}</p>
            <h1 className="mt-2 text-[clamp(1.5rem,2.5vw,2rem)] font-normal leading-[1.1] tracking-[-0.02em] text-gray-900">
              {title}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {actions}
            <AdminSignOut />
          </div>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}

/**
 * The one admin form control. The manage pages used to hand-write the same
 * class string (in three drifting variants: some with a focus ring, some
 * without, different vertical padding in the edit rows); every raw
 * <input>/<textarea> in the area now goes through here.
 *
 *  - every prop (type, value, onChange, required, min, max, step, rows,
 *    disabled, aria-*, placeholder...) is forwarded untouched
 *  - `className` is appended, for layout classes like `md:col-span-2` or
 *    `min-h-[140px]`
 *  - `variant="inline"` renders `flex-1` with tighter padding for the
 *    inline edit rows (the default is the full-width form control)
 */
const BASE_CONTROL =
  "rounded-md border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand disabled:opacity-60";
// The vertical padding lives outside BASE_CONTROL so the inline variant's
// py-1.5 cannot fight the base py-2 in the class list (last-in-list does not
// win in CSS; the stylesheet order does, which made the override unreliable).
const PAD_FULL = "py-2";
const PAD_INLINE = "py-1.5";

export function AdminInput({ variant = "full", className = "", ...rest }) {
  const shape = variant === "inline" ? "flex-1" : "w-full";
  const pad = variant === "inline" ? PAD_INLINE : PAD_FULL;
  return <input className={`${shape} ${pad} ${BASE_CONTROL} ${className}`} {...rest} />;
}

export function AdminTextarea({ variant = "full", className = "", rows = 4, ...rest }) {
  const shape = variant === "inline" ? "flex-1" : "w-full";
  const pad = variant === "inline" ? PAD_INLINE : PAD_FULL;
  return <textarea rows={rows} className={`${shape} ${pad} ${BASE_CONTROL} ${className}`} {...rest} />;
}

/**
 * The one card. The old pages each hand-rolled `rounded-2xl shadow-md`; the
 * design language's hairline card reads calmer and matches the public site.
 *
 * `pad` replaces the default padding outright rather than adding to it, the same
 * choice `Section` makes in the public language: appending `p-8` to a card that
 * already says `p-6` is decided by stylesheet order and not by the class list, so
 * the override cannot be relied on.
 */
export function AdminCard({ className = "", pad = "p-6", children }) {
  return (
    <div className={`rounded-lg border border-black/10 bg-white ${pad} ${className}`}>
      {children}
    </div>
  );
}

/**
 * A labelled number, for the count rows the operations and recovery pages show.
 *
 * Those two used to hand-roll the same block in their own copy, and each gave its
 * numbers its own colour: blue for one stage, amber for the next, red for the last,
 * green for the good one. A screen of six differently coloured figures reads as
 * decoration rather than information, and it made a status look like a different
 * kind of thing on each page. The number is now the same near-black wherever it
 * appears, and the colour that carries meaning lives in the pill beside it.
 */
export function AdminStat({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-normal text-gray-900">{value ?? 0}</p>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/**
 * The one status pill, in the four tones a status actually needs.
 *
 * There were three drifting badge maps before this (payments and operations each
 * had their own, one page inlined a fourth), so the same state could be amber on
 * one screen and orange on another. The tones are named for meaning rather than
 * colour, so a caller says what it knows and not how it should look.
 *
 * These are hairlines with tinted text rather than saturated blocks: the admin
 * area is read for long stretches, and a wall of full-strength backgrounds is
 * the kind of wash the public pages had removed.
 */
const PILL_TONES = {
  neutral: "border-black/10 bg-white text-gray-600",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  attention: "border-amber-200 bg-amber-50 text-amber-700",
  negative: "border-rose-200 bg-rose-50 text-rose-700",
};

export function AdminPill({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        PILL_TONES[tone] || PILL_TONES.neutral
      }`}
    >
      {children}
    </span>
  );
}
