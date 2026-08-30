import { useEffect } from "react";
import arrow from "../../../assets/svg-icons/black-arrow.svg"
import { Link } from "react-router-dom";

const AccountSettings = ({setPageTitle}) => {
    useEffect((() => {
      setPageTitle("Account Settings");
      document.title = "Account settings | RapidStylers";
    }));
    return ( 
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Account settings</h1>
            <p className="mt-0.5 text-xs text-gray-500">Manage your account details and preferences</p>
          </div>
        </div>
        <div className="p-4 grid gap-4">
          <Link to={"/updatePersonalInformation"}>
          <div className="flex items-center justify-between py-3">
            <span className="">Update personal information</span>
            <div>
              <img src={arrow} alt="" className="h-5"/>
            </div>
          </div>
          </Link>
          <Link to={"/changePassword"}>
          <div className="flex items-center justify-between py-3">
            <span className="">Change password</span>
            <div>
              <img src={arrow} alt="" className="h-5"/>
            </div>
          </div>
          </Link>
          <Link to={"/support"}>
          <div className="flex items-center justify-between py-3">
            <span className="">Support</span>
            <div>
              <img src={arrow} alt="" className="h-5"/>
            </div>
          </div>
          </Link>
          <Link to={"/loyalty"}>
          <div className="flex items-center justify-between py-3">
            <span className="">Loyalty and referrals</span>
            <div>
              <img src={arrow} alt="" className="h-5"/>
            </div>
          </div>
          </Link>
          <Link to={"/notifications"}>
          <div className="flex items-center justify-between py-3">
            <span className="">Notifications</span>
            <div>
              <img src={arrow} alt="" className="h-5"/>
            </div>
          </div>
          </Link>
          <Link to={"/notificationSettings"}>
          <div className="flex items-center justify-between py-3">
            <span className="">Manage notification preferences</span>
            <div>
              <img src={arrow} alt="" className="h-5"/>
            </div>
          </div>
          </Link>
        </div>
    </div>
     );
}
 
export default AccountSettings;