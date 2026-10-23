import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import StylerTopBar from "./topNav";
import BusinessSummary from "../stylerComponents/businessSummary";
import ReviewsSummary from "../stylerComponents/reviewsSummary";
import ListingStatusNotice from "../stylerComponents/listingStatusNotice";
import PayoutSetupNotice from "../stylerComponents/payoutSetupNotice";
import { getAuthToken, getUserRole, setIntendedRoute } from "../../../utils/constant";
import { logoutSession } from "../../../utils/sessionLogout";
import { useUnreadNotifications } from "../../users/userLayout/unreadNotifications";

// Shared navigation and a focused workspace for each stylist page.
const NAV_ITEMS = [
  { to: "/styler-dashboard", label: "Overview" },
  { to: "/styler-dashboard/notifications", label: "Notifications" },
  { to: "/styler-dashboard/appointments", label: "Appointments", group: "Bookings" },
  { to: "/styler-dashboard/quotes", label: "Quotes" },
  { to: "/styler-dashboard/calendar", label: "Calendar" },
  { to: "/styler-dashboard/availability", label: "Availability" },
  { to: "/styler-dashboard/services", label: "Services", group: "Business" },
  { to: "/styler-dashboard/my-work", label: "My work" },
  { to: "/styler-dashboard/payouts", label: "Payouts" },
  { to: "/styler-dashboard/reviews", label: "Reviews" },
  { to: "/styler-dashboard/profile", label: "My profile", group: "Account" },
  { to: "/styler-dashboard/support", label: "Support" },
];

// Pages reached from My profile rather than the sidebar: their own heading,
// with My profile kept highlighted as the section they belong to.
const PROFILE_PAGES = {
  "/styler-dashboard/appointment-locations": "Appointment locations",
  "/styler-dashboard/update-cover-photo": "Update photos",
  "/styler-dashboard/update-business-information": "Business information",
  "/styler-dashboard/update-personal-information": "Personal information",
  "/styler-dashboard/change-password": "Change password",
};
// Pages that print their own H1, so the shell does not add a second one.
const OWN_HEADING = new Set(["/styler-dashboard/support", "/styler-dashboard/notifications"]);

// The unread count rides on the Notifications item, read out with the label.
const NavLabel = ({ to, label, unread }) => (
  to === "/styler-dashboard/notifications" && unread > 0 ? (
    <span className="flex items-center justify-between gap-2">
      {label}
      <span className="min-w-[20px] rounded-full bg-brand px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white">
        <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
        <span className="sr-only">, {unread} unread</span>
      </span>
    </span>
  ) : label
);

/** The sidebar item a path belongs to and the heading/tab title it shows. */
export const stylerPageFor = (pathname) => {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (PROFILE_PAGES[path]) return { section: "/styler-dashboard/profile", title: PROFILE_PAGES[path] };
  const item = NAV_ITEMS.find((nav) => nav.to === path)
    || [...NAV_ITEMS].reverse().find((nav) => nav.to !== "/styler-dashboard" && path.startsWith(nav.to + "/"));
  return item ? { section: item.to, title: item.label } : { section: null, title: "My profile" };
};

const StylerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = () => {
    if (menuOpen) menuButtonRef.current?.focus();
    setMenuOpen(false);
  };
  const page = stylerPageFor(location.pathname);
  // Re-read on every page change; the inbox page also announces its own changes.
  const signedInStyler = Boolean(getAuthToken()) && getUserRole() === "STYLER";
  const unreadNotifications = useUnreadNotifications(location.pathname, signedInStyler ? "/styler/notifications" : null);
  // One tab title per page, set here so a title left behind by the previous
  // page (Overview used to read "Reviews | RapidStylers") cannot stick.
  useEffect(() => {
    document.title = `${page.title} | RapidStylers`;
  }, [page.title]);
  // Escape closes the mobile menu wherever focus is, not only inside the nav.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);
  // Role gate: the whole /styler-dashboard area is styler-only. Without this a
  // logged-out visitor or a customer can open the shell and its sidebar.
  if (!getAuthToken() || getUserRole() !== "STYLER") {
    setIntendedRoute(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  const overview = page.section === "/styler-dashboard";
  const signOut = () => {
    logoutSession();
    navigate("/login", { replace: true });
  };
  return (
    <div className="bg-white min-h-screen">
      <StylerTopBar toggleSideBar={() => setMenuOpen(open => !open)} menuOpen={menuOpen} menuButtonRef={menuButtonRef} />
      {/* Explains a profile that is hidden for having no address. Renders
          nothing at all when there is nothing to say. */}
      <div className="pt-[70px]">
        <ListingStatusNotice />
        <PayoutSetupNotice />
      </div>
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className={`px-4 relative ${menuOpen ? "block" : "hidden"} lg:block`}>
          <nav id="styler-dashboard-navigation" aria-label="Stylist dashboard" className="grid gap-1 py-4 lg:pt-8 lg:pb-14 px-4 lg:px-0 text-[13px] font-medium lg:sticky lg:top-[70px] bg-white lg:bg-transparent">
            {NAV_ITEMS.map(({ to, label, group }) => (
              <div key={to}>
              {/* A section label, styled apart from the links so it never reads as a
                  disabled item: small caps above a hairline, not grey link text. */}
              {group && (
                <p className="mt-3 border-t border-black/[0.08] px-4 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand/80">
                  {group}
                </p>
              )}
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                aria-current={location.pathname === to ? "page" : page.section === to ? "true" : undefined}
                className={`block py-2.5 px-4 rounded-full transition-colors ${
                  page.section === to
                    ? `bg-brand/10 text-brand font-semibold ${location.pathname === to ? "cursor-default" : "cursor-pointer"}`
                    : "text-black/60 hover:text-onSurface hover:bg-black/[0.04] cursor-pointer"
                }`}
              >
                <NavLabel to={to} label={label} unread={unreadNotifications} />
              </Link>
              </div>
            ))}
            <button
              onClick={signOut}
              className="py-2.5 px-4 rounded-full cursor-pointer text-left w-full text-black/60 hover:text-onSurface hover:bg-black/[0.04] transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
        <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
          {!OWN_HEADING.has(page.section) && <h1 className="mb-6 text-2xl font-semibold text-onSurface">{page.title}</h1>}
          <div className={overview ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]" : "w-full"}>
            <div className="min-w-0"><Outlet /></div>
            {overview && <aside aria-label="Business overview" className="grid gap-4">
              <BusinessSummary />
              <ReviewsSummary />
            </aside>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StylerLayout;
