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
 */
const NAV_ITEMS = [
  { to: "/dashboard", title: "Dashboard", label: "Dashboard" },
  { to: "/bookAppointment", title: "Book Appointment", label: "Book an Appointment" },
  { to: "/accountSettings", title: "Account Settings", label: "Account Settings" },
  { to: "/savedStylist", title: "Saved Stylists", label: "Saved Stylists" },
  { to: "/feedback", title: "Feedback", label: "Feedback" },
];

const UserSideBar = ({ sideBarVisibility, sideBarTitle, closeSideBar }) => {
    return (
        <div>
            {/* Desktop */}
            <div className="hidden md:block">
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
                            {label}
                        </Link>
                    ))}
                    <Link
                        to="/signOut"
                        className="py-2.5 px-4 rounded-full cursor-pointer text-black/60 hover:text-onSurface hover:bg-black/[0.04] transition-colors"
                    >
                        Sign Out
                    </Link>
                </nav>
            </div>

            {/* Mobile */}
            <div className={`w-full fixed md:hidden ${sideBarVisibility ? "block" : "hidden"}`}>
                <div className="bg-white p-8 m-2 rounded-lg border border-black/10 shadow-sm h-full">
                    <div className="flex justify-between">
                        <img src={logo} alt="" className="h-10" />
                        <img src={close} alt="" onClick={closeSideBar} className="h-5" />
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
                                    {label}
                                </Link>
                            </div>
                        ))}
                        <div onClick={closeSideBar}>
                            <Link
                                to="/signOut"
                                className="block py-2.5 px-4 rounded-full text-black/60 hover:text-onSurface hover:bg-black/[0.04] transition-colors"
                            >
                                Sign Out
                            </Link>
                        </div>
                    </nav>
                </div>
            </div>
        </div>
    );
}

export default UserSideBar;
