import logo from "../../../assets/svg-icons/colouredLogo.svg";
import { Link } from "react-router-dom";
import { CurrentDateTime } from "../../../utils/utility";
const UserTopBar = ({toggleSideBar, menuOpen = false, menuButtonRef}) => {
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
        <div className="text-[13px] text-black/55 hidden md:block">
          {CurrentDateTime()}
        </div>
      </div>);
}

export default UserTopBar;
