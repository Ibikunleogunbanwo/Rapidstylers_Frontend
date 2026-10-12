import { Link } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import close from "../../../assets/svg-icons/closeBlack.svg";

/**
 * The customer dashboard sidebar, in the same register as the stylist one:
 * one nav array instead of two hand-copied lists, a quiet brand-tinted pill
 * for the active item instead of the solid purple slab, and hairline chrome.
 *
 * The desktop list keys the active state off `sideBarTitle` (the title each
 * page sets through the layout); the old Sign Out entries compared against
 * "/dashboard" and "signOut", titles no page sets, so it could never
 * highlight — the array keys it off "Sign Out" like every other item, which
 * keeps the visible behavior identical and drops the dead comparisons.
 *
 * Sign Out is a button that runs the layout's logout (onSignOut), not a link
 * to /signOut: a GET URL lets any page that links or embeds it sign people out.
 */
const NAV_ITEMS = [
  { to: "/dashboard", title: "Dashboard", label: "Dashboard" },
  { to: "/bookAppointment", title: "Book Appointment", label: "Book an Appointment" },
  { to: "/accountSettings", title: "Account Settings", label: "Account Settings" },
  { to: "/notifications", title: "Notifications", label: "Notifications" },
  { to: "/savedStylist", title: "Saved professionals", label: "Saved professionals" },
  { to: "/feedback", title: "Feedback", label: "Feedback" },
];

// The unread count rides on the Notifications item, read out with the label.
const NavLabel = ({ to, label, unread }) => (
    to === "/notifications" && unread > 0 ? (
        <span className="flex items-center justify-between gap-2">
            {label}
            <span className="min-w-[20px] rounded-full bg-brand px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white">
                <span aria-hidden="true">{unread > 99 ? "99+" : unread}</span>
                <span className="sr-only">, {unread} unread</span>
            </span>
        </span>
    ) : label
);

const SIGN_OUT_CLASS = "w-full text-left rounded-full text-black/60 hover:text-onSurface hover:bg-black/[0.04] transition-colors focus-visible:outline-2 focus-visible:outline-brand";

const UserSideBar = ({ sideBarVisibility, sideBarTitle, closeSideBar, onSignOut, unreadNotifications = 0 }) => {
    return (
        <div>
            {/* Desktop */}
            <div className="hidden lg:block">
                <nav className="grid gap-1 pt-8 pb-14 px-8 lg:px-0 text-[13px] font-medium fixed bg-white lg:bg-transparent">
                    {NAV_ITEMS.map(({ to, title, label }) => (
                        <Link
                            key={to}
                            to={to}
                            aria-current={sideBarTitle === title ? "page" : undefined}
                            className={`py-2.5 px-4 rounded-full transition-colors ${
                                sideBarTitle === title
                                    ? "bg-brand/10 text-brand font-semibold cursor-default"
                                    : "text-black/60 hover:text-onSurface hover:bg-black/[0.04] cursor-pointer"
                            }`}
                        >
                            <NavLabel to={to} label={label} unread={unreadNotifications} />
                        </Link>
                    ))}
                    <button
                        type="button"
                        onClick={onSignOut}
                        className={`py-2.5 px-4 cursor-pointer ${SIGN_OUT_CLASS}`}
                    >
                        Sign Out
                    </button>
                </nav>
            </div>

            {/* Mobile */}
            <div id="customer-dashboard-navigation" onKeyDown={event => { if (event.key === "Escape") closeSideBar(); }} className={`w-full fixed inset-x-0 top-[70px] bottom-0 overflow-y-auto z-40 lg:hidden ${sideBarVisibility ? "block" : "hidden"}`}>
                <div className="bg-white p-8 m-2 rounded-lg border border-black/10 shadow-sm h-full">
                    <div className="flex justify-between">
                        <img src={logo} alt="" className="h-10" />
                        <button type="button" aria-label="Close navigation" onClick={closeSideBar} className="p-2"><img src={close} alt="" className="h-5" /></button>
                    </div>
                    <nav className="grid gap-1 mt-8">
                        {NAV_ITEMS.map(({ to, title, label }) => (
                            <div key={to} onClick={closeSideBar}>
                                <Link
                                    to={to}
                                    aria-current={sideBarTitle === title ? "page" : undefined}
                                    className={`block py-2.5 px-4 rounded-full transition-colors ${
                                        sideBarTitle === title
                                            ? "bg-brand/10 text-brand font-semibold"
                                            : "text-black/60 hover:text-onSurface hover:bg-black/[0.04]"
                                    }`}
                                >
                                    <NavLabel to={to} label={label} unread={unreadNotifications} />
                                </Link>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => { closeSideBar(); onSignOut?.(); }}
                            className={`block py-2.5 px-4 ${SIGN_OUT_CLASS}`}
                        >
                            Sign Out
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
}

export default UserSideBar;
