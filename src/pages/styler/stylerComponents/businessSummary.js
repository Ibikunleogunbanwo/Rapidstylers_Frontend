import { useEffect, useState } from "react";
import hidden from "../../../assets/svg-icons/toggleOff.svg";
import show from "../../../assets/svg-icons/toggleOn.svg";
import { APIService } from "../../../hooks/remote/apiService";

const formatMoney = (value) => {
  const num = Number(value || 0);
  return "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const BusinessSummary = () => {
  const [revenueVisible, setRevenueVisible] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    APIService.getStylerBusinessSummary()
      .then((response) => setSummary(response.data?.data || null))
      .catch(() => setSummary(null));
  }, []);

  const toggleVisibility = () => {
    setRevenueVisible(!revenueVisible);
  };

  const value = (n) => (summary ? Number(n || 0).toLocaleString() : "–");
  const popularServices = summary?.popularServices || [];

    return ( 
        <div className="grid gap-4">
            <div className="rounded-md border">
              <p className="p-4 border-b text-sm font-bold truncate">Business summary</p>
              <div className="p-4 grid grid-cols-2 gap-4 overflow-hidden">
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Appointments:</div>
                  <div className="font-semibold">{value(summary?.totalAppointments)}</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Clients:</div>
                  <div className="font-semibold">{value(summary?.clients)}</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Pending:</div>
                  <div className="font-semibold">{value(summary?.pending)}</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Confirmed:</div>
                  <div className="font-semibold">{value(summary?.confirmed)}</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Finished:</div>
                  <div className="font-semibold">{value(summary?.finished)}</div>
                </div>
                <div className="">
                  <div className="text-[13px] text-gray-500 truncate">Cancelled:</div>
                  <div className="font-semibold">{value(summary?.cancelled)}</div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center w-full gap-2">
                    <div className="text-[13px] text-gray-500 truncate">Net revenue (after commission):</div>
                    <div onClick={toggleVisibility} className="cursor-pointer">
                        <img src={revenueVisible? show : hidden} alt="" className="h-[18px] mt-[2px]"/>
                    </div>
                  </div>
                  <span className="font-semibold">{revenueVisible ? (summary ? formatMoney(summary.netRevenue) : "–") : '********'}</span>
                  {revenueVisible && summary && (
                    <p className="text-[11px] text-gray-400 mt-0.5">Gross {formatMoney(summary.totalRevenue)} − commission {formatMoney(summary.totalCommission)}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-md border overflow-hidden">
              <p className="p-4 border-b text-sm font-bold">Popular services:</p>
              {popularServices.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">{summary ? "No bookings yet — services will appear here once clients book them." : "Loading…"}</p>
              ) : (
                <div className="p-4 grid gap-4">
                  {popularServices.map((service, index) => (
                    <div key={index} className="flex justify-between gap-2 text-sm hover:text-brand cursor-default transition-all rounded-md duration-300">
                      <div className="text-gray-500 hover:text-brand truncate">{service.name}</div>
                      <div className="font-semibold shrink-0">{Number(service.count || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
        </div>
     );
}
 
export default BusinessSummary;
