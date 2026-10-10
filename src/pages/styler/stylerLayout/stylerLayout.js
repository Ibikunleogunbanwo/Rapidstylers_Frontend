import { useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import StylerTopBar from "./topNav";
import BusinessSummary from "../stylerComponents/businessSummary";
import ReviewsSummary from "../stylerComponents/reviewsSummary";
import ListingStatusNotice from "../stylerComponents/listingStatusNotice";
import { getAuthToken, getUserRole, setIntendedRoute } from "../../../utils/constant";
import { logoutSession } from "../../../utils/sessionLogout";

// Shared navigation and a focused workspace for each stylist page.
const NAV_ITEMS = [
  { to: "/styler-dashboard", label: "Overview" },
  { to: "/styler-dashboard/appointments", label: "Appointments", group: "Bookings" },
  { to: "/styler-dashboard/calendar", label: "Calendar" },
  { to: "/styler-dashboard/availability", label: "Availability" },
  { to: "/styler-dashboard/services", label: "Services", group: "Business" },
  { to: "/styler-dashboard/my-work", label: "My work" },
  { to: "/styler-dashboard/payouts", label: "Payouts" },
  { to: "/styler-dashboard/reviews", label: "Reviews" },
  { to: "/styler-dashboard/profile", label: "My profile", group: "Account" },
];

const StylerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const closeMenu = () => {
    if (menuOpen) menuButtonRef.current?.focus();
    setMenuOpen(false);
  };
  // Role gate: the whole /styler-dashboard area is styler-only. Without this a
  // logged-out visitor or a customer can open the shell and its sidebar.
  if (!getAuthToken() || getUserRole() !== "STYLER") {
    setIntendedRoute(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  const overview = location.pathname === "/styler-dashboard";
  const currentPage = [...NAV_ITEMS].reverse().find(item => location.pathname === item.to || location.pathname.startsWith(item.to + "/"));
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
      </div>
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className={`px-4 relative ${menuOpen ? "block" : "hidden"} lg:block`}>
          <nav id="styler-dashboard-navigation" aria-label="Stylist dashboard" onKeyDown={event => {
            if (event.key === "Escape") {
              closeMenu();
              menuButtonRef.current?.focus();
            }
          }} className="grid gap-1 py-4 lg:pt-8 lg:pb-14 px-4 lg:px-0 text-[13px] font-medium lg:sticky lg:top-[70px] bg-white lg:bg-transparent">
            {NAV_ITEMS.map(({ to, label, group }) => (
              <div key={to}>
              {group && <p className="px-4 pt-5 pb-2 text-xs text-black/45">{group}</p>}
              <Link
                key={to}
                to={to}
                onClick={closeMenu}
                aria-current={location.pathname === to ? "page" : undefined}
                className={`block py-2.5 px-4 rounded-full transition-colors ${
                  location.pathname === to
                    ? "bg-brand/10 text-brand font-semibold cursor-default"
                    : "text-black/60 hover:text-onSurface hover:bg-black/[0.04] cursor-pointer"
                }`}
              >
                {label}
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
          <h1 className="mb-6 text-2xl font-semibold text-onSurface">{currentPage?.label || "My profile"}</h1>
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
