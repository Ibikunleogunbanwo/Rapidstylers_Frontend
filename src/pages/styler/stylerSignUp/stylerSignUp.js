import logo from "../../../assets/svg-icons/colouredLogo.svg";
import { Outlet } from "react-router-dom";


const StylerSignUp = () => {
  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
      </div>
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full">
            <div className=" mb-6">
              <img src={logo} alt="" className="h-10" />
              <span className="text-xs text-gray-500 font-medium">
                For professionals
              </span>
            </div>
            <Outlet />
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default StylerSignUp;
