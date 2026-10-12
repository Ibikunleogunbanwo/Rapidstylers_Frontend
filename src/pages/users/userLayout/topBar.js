import logo from "../../../assets/svg-icons/colouredLogo.svg";
import { Link } from "react-router-dom";
import { CurrentDateTime } from "../../../utils/utility";
// The signed-in person's name (or email when the account has no name yet),
// shown with initials like the stylist header.
const accountLabel = (account) => {
  const name = [account?.firstname, account?.lastname].map(part => String(part || "").trim()).filter(Boolean).join(" ");
  return name || String(account?.emailAddress || "").trim();
};

const UserTopBar = ({toggleSideBar, menuOpen = false, menuButtonRef, account = null, onSignOut}) => {
    const label = accountLabel(account);
    const initials = label
      ? label.split(/\s+/).filter(Boolean).slice(0, 2).map(part => Array.from(part)[0]).join("").toUpperCase()
      : "";
    return (
        <div className="h-[70px] flex items-center justify-between bg-white/95 backdrop-blur border-b border-black/10 fixed w-full px-3 md:px-4 z-50">
        <div className="flex items-center gap-6">
          <button type="button" ref={menuButtonRef} onClick={toggleSideBar}
            aria-label={menuOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
            aria-expanded={menuOpen} aria-controls="customer-dashboard-navigation"
            className="p-2 flex items-center gap-2 text-xs text-onSurface lg:hidden rounded-md focus-visible:outline-2 focus-visible:outline-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
            <span>Menu</span>
          </button>
          <Link to="/" aria-label="RapidStylers home" className="rounded-md focus-visible:outline-2 focus-visible:outline-brand">
            <img src={logo} alt="" className="h-12"/>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[13px] text-black/55 hidden md:block">
            {CurrentDateTime()}
          </div>
          {label && (
            <div className="flex items-center gap-2" title={label}>
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-semibold text-brand">{initials}</span>
              <span className="hidden max-w-[160px] truncate text-[13px] font-medium text-onSurface sm:block">{label}</span>
            </div>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs font-semibold text-black/55 border border-black/20 rounded-full px-4 py-2 transition-colors hover:border-black/40 hover:text-onSurface focus-visible:outline-2 focus-visible:outline-brand"
            >
              Sign out
            </button>
          )}
        </div>
      </div>);
}

export default UserTopBar;
