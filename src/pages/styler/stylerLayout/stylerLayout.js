import { Link, Outlet, useLocation } from "react-router-dom";
import StylerTopBar from "./topNav";
import BusinessSummary from "../stylerComponents/businessSummary";

const StylerLayout = () => {
  const location = useLocation();
  return (
    <div className="bg-white min-h-screen">
      <StylerTopBar />
      <div className="pt-[70px] grid grid-cols-1 lg:grid-cols-12">
        <div className="px-4 col-span-1 lg:col-span-2 hidden lg:block relative">
          <div className="grid gap-10 pt-8 pb-14 px-8 lg:px-0 text-xs font-medium fixed bg-white lg:bg-transparent">
            <div>
              <Link
                to="/styler-dashboard"
                className={`py-4 px-4 rounded-md ${
                  location.pathname === "/styler-dashboard"
                    ? "bg-brand text-white cursor-default"
                    : "cursor-pointer"
                }`}
              >
                Overview
              </Link>
            </div>
            <div>
              <Link
                to="/styler-dashboard/appointments"
                className={`py-4 px-4 rounded-md ${
                  location.pathname === "/styler-dashboard/appointments"
                    ? "bg-brand text-white cursor-default"
                    : "cursor-pointer"
                }`}
              >
                Appointments
              </Link>
            </div>
            <div>
              <Link
                to="/styler-dashboard/services"
                className={`py-4 px-4 rounded-md ${
                  location.pathname === "/styler-dashboard/services"
                    ? "bg-brand text-white cursor-default"
                    : "cursor-pointer"
                }`}
              >
                Services
              </Link>
            </div>
            <div>
              <Link
                to="/styler-dashboard/profile"
                className={`py-4 px-4 rounded-md ${
                  location.pathname === "/styler-dashboard/profile"
                    ? "bg-brand text-white cursor-default"
                    : "cursor-pointer"
                }`}
              >
                My profile
              </Link>
            </div>
          </div>
        </div>
        <div className="p-2 col-span-1 lg:col-span-10">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="col-span-1 lg:col-span-7">
                <Outlet />
            </div>
            <div className="col-span-1 lg:col-span-3">
                <BusinessSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylerLayout;
