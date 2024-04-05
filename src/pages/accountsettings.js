import arrow from "../assets/svg-icons/black-arrow.svg"
import { Link } from "react-router-dom";

const AccountSettings = () => {
    document.title="Account settings - TrimTech"
    return ( 
        <div className="bg-white border rounded-lg">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        Account settings
      </div>
      <div className="p-4 grid gap-4">
        <Link to={"/dashboard/update-personal-information"}>
        <div className="flex items-center justify-between py-3">
          <span className="">Update personal information</span>
          <div>
            <img src={arrow} alt="" className="h-5"/>
          </div>
        </div>
        </Link>
        <Link to={"/dashboard/saved-stylists"}>
        <div className="flex items-center justify-between py-3">
          <span className="">Saved stylists</span>
          <div>
            <img src={arrow} alt="" className="h-5"/>
          </div>
        </div>
        </Link>
        <Link to={"/dashboard/change-password"}>
        <div className="flex items-center justify-between py-3">
          <span className="">Change password</span>
          <div>
            <img src={arrow} alt="" className="h-5"/>
          </div>
        </div>
        </Link>
        <Link to={"/dashboard/payment-details"}>
        <div className="flex items-center justify-between py-3">
          <span className="">Add payment details</span>
          <div>
            <img src={arrow} alt="" className="h-5"/>
          </div>
        </div>
        </Link>
        <Link to={"/dashboard/notification-settings"}>
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