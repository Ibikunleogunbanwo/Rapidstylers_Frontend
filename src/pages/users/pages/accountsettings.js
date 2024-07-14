import { useEffect } from "react";
import arrow from "../../../assets/svg-icons/black-arrow.svg"
import { Link } from "react-router-dom";

const AccountSettings = ({setPageTitle}) => {
    useEffect((() => {
      setPageTitle("Account Settings");
      document.title = "Account settings - Rapid Styler";
    }));
    return ( 
        <div className="bg-white border rounded-lg">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        Account settings
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
        <Link to={"/savedStylist"}>
        <div className="flex items-center justify-between py-3">
          <span className="">Saved stylists</span>
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
        <Link to={"/PaymentDetails"}>
        <div className="flex items-center justify-between py-3">
          <span className="">Add card details</span>
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