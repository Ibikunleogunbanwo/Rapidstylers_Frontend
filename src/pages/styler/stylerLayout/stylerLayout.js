import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import StylerTopBar from "./topNav";
import BusinessSummary from "../stylerComponents/businessSummary";
import ReviewsSummary from "../stylerComponents/reviewsSummary";
import ListingStatusNotice from "../stylerComponents/listingStatusNotice";
import { getAuthToken, getUserRole, clearAllSessionTokens, setIntendedRoute } from "../../../utils/constant";
import { APIService } from "../../../hooks/remote/apiService";

/**
 * The stylist dashboard shell. The sidebar used to be eight copies of the same
 * block (one per link); it is now one array, and the active item is a quiet
 * brand-tinted pill rather than a solid purple slab, matching the site's
 * hairline register. Structure is unchanged: fixed top bar, sidebar on lg+,
 * main outlet beside the business summary.
 */
const NAV_ITEMS = [
  { to: "/styler-dashboard", label: "Overview" },
  { to: "/styler-dashboard/appointments", label: "Appointments" },
  { to: "/styler-dashboard/calendar", label: "Calendar" },
  { to: "/styler-dashboard/availability", label: "Availability" },
  { to: "/styler-dashboard/services", label: "Services" },
  { to: "/styler-dashboard/my-work", label: "My work" },
  { to: "/styler-dashboard/payouts", label: "Payouts" },
  { to: "/styler-dashboard/reviews", label: "Reviews" },
  { to: "/styler-dashboard/profile", label: "My profile" },
];

const StylerLayout = () => {
  const location = useLocation();
  // Role gate: the whole /styler-dashboard area is styler-only. Without this a
  // logged-out visitor or a customer can open the shell and its sidebar.
  if (!getAuthToken() || getUserRole() !== "STYLER") {
    setIntendedRoute(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  const signOut = () => {
    APIService.stylerSignOut();
    clearAllSessionTokens();
    window.location.href = "/";
  };
  return (
    <div className="bg-white min-h-screen">
      <StylerTopBar />
      {/* Explains a profile that is hidden for having no address. Renders
          nothing at all when there is nothing to say. */}
      <div className="pt-[70px]">
        <ListingStatusNotice />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="px-4 col-span-1 lg:col-span-2 hidden lg:block relative">
          <nav className="grid gap-1 pt-8 pb-14 px-8 lg:px-0 text-[13px] font-medium fixed bg-white lg:bg-transparent">
            {NAV_ITEMS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                aria-current={location.pathname === to ? "page" : undefined}
                className={`py-2.5 px-4 rounded-full transition-colors ${
                  location.pathname === to
                    ? "bg-brand/10 text-brand font-semibold cursor-default"
                    : "text-black/60 hover:text-onSurface hover:bg-black/[0.04] cursor-pointer"
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="py-2.5 px-4 rounded-full cursor-pointer text-left w-full text-black/60 hover:text-onSurface hover:bg-black/[0.04] transition-colors"
            >
              Sign out
            </button>
          </nav>
        </div>
        <div className="p-2 col-span-1 lg:col-span-10">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="col-span-1 lg:col-span-7">
                <Outlet />
            </div>
            <div className="col-span-1 lg:col-span-3 grid gap-4">
                <ReviewsSummary />
                <BusinessSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylerLayout;
