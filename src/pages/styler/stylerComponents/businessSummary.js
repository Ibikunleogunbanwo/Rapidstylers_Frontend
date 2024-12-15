import { useState } from "react";
import hidden from "../../../assets/svg-icons/toggleOff.svg";
import show from "../../../assets/svg-icons/toggleOn.svg";

const BusinessSummary = () => {

    const [revenueVisible, setRevenueVisible] = useState(false);

  const toggleVisibility = () => {
    setRevenueVisible(!revenueVisible);
  };

    return ( 
        <div className="grid gap-4">
            <div className="rounded-md border">
              <p className="p-4 border-b text-sm font-bold truncate">Business summary</p>
              <div className="p-4 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Appointments:</div>
                  <div className="font-semibold">99</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Clients:</div>
                  <div className="font-semibold">80</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Confirmed:</div>
                  <div className="font-semibold">90</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Finished:</div>
                  <div className="font-semibold">67</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Cancelled:</div>
                  <div className="font-semibold">3</div>
                </div>
                <div className="">
                  <div className="flex items-center w-full gap-2">
                    <div className="text-[13px] text-gray-500 truncate max-w-[80%]">Total revenue:</div>
                    <div onClick={toggleVisibility} className="cursor-pointer">
                        <img src={revenueVisible? show : hidden} alt="" className="h-[18px] mt-[2px]"/>
                    </div>
                  </div>
                  <span className="font-semibold">{revenueVisible ? '$23,000' : '********'}</span>
                </div>
              </div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <p className="p-4 border-b text-sm font-bold">Popular services:</p>
              <div className="p-4 grid gap-4">
                <div className="flex justify-between gap-2 text-sm hover:text-brand cursor-default transition-all rounded-md duration-300">
                  <div className="text-gray-500 hover:text-brand">Special haircut - (skin fade, blow out, mohawk)</div>
                  <div className="font-semibold">54</div>
                </div>
                <div className="flex justify-between gap-2 text-sm hover:text-brand cursor-default transition-all rounded-md duration-300">
                  <div className="text-gray-500 hover:text-brand">Apprentice hair - (anything that happens, hold apprentice)</div>
                  <div className="font-semibold">54</div>
                </div>
                <div className="flex justify-between gap-2 text-sm hover:text-brand cursor-default transition-all rounded-md duration-300">
                  <div className="text-gray-500 hover:text-brand">Simple dreadlocks</div>
                  <div className="font-semibold">54</div>
                </div>
              </div>
            </div>
        </div>
     );
}
 
export default BusinessSummary;