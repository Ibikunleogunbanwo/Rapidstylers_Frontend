import logo from "../../../assets/svg-icons/colouredLogo.svg";
import menu from "../../../assets/svg-icons/menu-brand.svg";
import { CurrentDateTime } from "../../../utils/utility";
import { clearAuthToken } from "../../../utils/constant";
import { APIService } from "../../../hooks/remote/apiService";

const StylerTopBar = ({toggleSideBar}) => {
    const handleSignOut = () => {
        // Best-effort backend notice (toggles offline), then always clear the
        // local token — without this the browser stays locked in the styler
        // session because /login redirects while any token exists.
        APIService.stylerSignOut();
        clearAuthToken();
        window.location.href = "/";
    };

    return (
        <div className="h-[70px] flex items-center justify-between bg-[#F7F5FF] border-b fixed w-full px-3 md:px-4 z-50">
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
          <div className="text-[13px] hidden md:block font-medium">
            {CurrentDateTime()}
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-white bg-brand rounded-md px-4 py-2"
          >
            Sign out
          </button>
        </div>
      </div>);
}

export default StylerTopBar;