import logo from "../../../assets/svg-icons/colouredLogo.svg";
import { CurrentDateTime } from "../../../utils/utility";
import { logoutSession } from "../../../utils/sessionLogout";
import { useNavigate } from "react-router-dom";

const StylerTopBar = ({toggleSideBar, menuOpen = false, menuButtonRef}) => {
    const navigate = useNavigate();
    const handleSignOut = () => {
        logoutSession();
        navigate("/login", { replace: true });
    };

    return (
        <div className="h-[70px] flex items-center justify-between bg-white/95 backdrop-blur border-b border-black/10 fixed w-full px-3 md:px-4 z-50">
        <div className="flex items-center gap-6">
          <button
            type="button"
            ref={menuButtonRef}
            aria-label={menuOpen ? "Close dashboard navigation" : "Open dashboard navigation"}
            aria-expanded={menuOpen}
            aria-controls="styler-dashboard-navigation"
            className="p-2 flex items-center gap-2 text-xs text-onSurface lg:hidden rounded-md focus-visible:outline-2 focus-visible:outline-brand"
            onClick={toggleSideBar}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            <span>Menu</span>
          </button>
          <img src={logo} alt="RapidStylers" className="h-12"/>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[13px] hidden md:block text-black/55">
            {CurrentDateTime()}
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-black/55 border border-black/20 rounded-full px-4 py-2 transition-colors hover:border-black/40 hover:text-onSurface"
          >
            Sign out
          </button>
        </div>
      </div>);
}

export default StylerTopBar;