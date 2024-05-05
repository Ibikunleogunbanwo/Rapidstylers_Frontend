// import arrow from "../assets/svg-icons/black-arrow-back.svg"
import { useEffect } from "react";
import Back from "../../../components/goBack";
import Input from "../../../components/input";

const ChangePassword = ({setPageTitle}) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Change Password - Rapid Styler";
  }));
  return (
    <div className="bg-white rounded-lg border">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Change password.</span>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={"Old password:"} type={"text"}/>
        <Input label={"New password:"} type={"text"}/>
        <div><button className="bg-brand px-6 py-4 md:py-3 text-sm text-white rounded-md">Update password</button></div>
      </div>
    </div>
  );
};

export default ChangePassword;
