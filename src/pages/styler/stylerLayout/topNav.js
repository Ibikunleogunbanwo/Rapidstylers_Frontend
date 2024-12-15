import logo from "../../../assets/svg-icons/colouredLogo.svg";
import menu from "../../../assets/svg-icons/menu-brand.svg";
import { CurrentDateTime } from "../../../utils/utility";
const StylerTopBar = ({toggleSideBar}) => {
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
        <div className="text-[13px] hidden md:block font-medium">
          {CurrentDateTime()}
        </div>
      </div>);
}

export default StylerTopBar;