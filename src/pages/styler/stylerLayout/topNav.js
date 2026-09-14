import logo from "../../../assets/svg-icons/colouredLogo.svg";
import menu from "../../../assets/svg-icons/menu-brand.svg";
import { CurrentDateTime } from "../../../utils/utility";
import { clearAllSessionTokens } from "../../../utils/constant";
import { APIService } from "../../../hooks/remote/apiService";

const StylerTopBar = ({toggleSideBar}) => {
    const handleSignOut = () => {
        // Best-effort backend notice (toggles offline), then always clear the
        // local token — without this the browser stays locked in the styler
        // session because /login redirects while any token exists.
        APIService.stylerSignOut();
        clearAllSessionTokens();
        window.location.href = "/";
    };

    return (
        <div className="h-[70px] flex items-center justify-between bg-white/95 backdrop-blur border-b border-black/10 fixed w-full px-3 md:px-4 z-50">
        <div className="flex items-center gap-6">
          <img
            src={menu}
            alt=""
            className="h-5 block lg:hidden cursor-pointer"
            onClick={toggleSideBar}
          />
          <img src={logo} alt="" className="h-12"/>
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