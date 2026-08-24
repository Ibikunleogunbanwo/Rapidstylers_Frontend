import { Link, useNavigate } from "react-router-dom";
import arrow from "../../../assets/svg-icons/arrow.svg";
import search from "../../../assets/svg-icons/search.svg";
import { useEffect, useState } from "react";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";
import { useStylerList } from "../userLayout/functionalEffects";
import { useUserLocation } from "../../../context/LocationContext";
import LocationPicker from "../../../components/locationPicker";

const BookAppointment = ({ setPageTitle, setStylerSearchName }) => {
  useEffect((() => {
    setPageTitle("Book Appointment");
    document.title = "Book an appointment | RapidStylers";
  }));
  const stylerList = useStylerList();
  const [stylerName, setStylerName] = useState("");
  const navigate = useNavigate()
  const { location: userLocation } = useUserLocation();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const displayLocation = userLocation
    ? [userLocation.city, userLocation.province].filter(Boolean).join(", ") || "Unknown"
    : "Detecting...";

  const searchStyler = () => {
    setStylerSearchName(stylerName);
    navigate("/searchAStyler")
  }

  // "Let the system decide" — show professionals in the chosen area.
  const systemDecideUrl = () => {
    const params = new URLSearchParams();
    if (userLocation?.province) params.set("province", userLocation.province);
    if (userLocation?.city) params.set("city", userLocation.city);
    return `/search?${params.toString()}`;
  }

  return (
    <div className="bg-white border rounded-lg">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">Book an appointment.</div>
      <div className="p-4">
        <div className="text-sm grid gap-4 md:flex md:justify-between ">
          <p>
            Current location:{" "}
            <span className="font-medium text-brand">{displayLocation}</span>
          </p>
          <button
            onClick={() => setLocationPickerOpen(true)}
            className="text-brand cursor-pointer hover:underline"
          >
            [ Change location ]
          </button>
        </div>
        <div className="my-6 overflow-hidden rounded-[4px]">
          <span className="border w-full rounded-[4px] bg-white flex items-center gap-3 p-1">
            <img src={search} alt="" className="h-5 ps-4" />
            <input
              type="search"
              value={stylerName}
              onChange={(e)=>setStylerName(e.target.value)}
              className="w-full active:border-0 active:outline-0 focus:border-0 focus:outline-0 placeholder:text-sm"
              placeholder="Search for a professional"
            />
              <button onClick={searchStyler} className="bg-brand text-sm h-full flex gap-2 items-center text-white py-4 md:py-3 px-5 rounded" >
                <span>Search</span>
              </button>
          </span>
        </div>
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate(systemDecideUrl())}
            className="block text-center text-slate-400 hover:text-brand transition-colors w-full"
          >
            Or <br /> let the system decide
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {
            stylerList.length > 0 ?
              (
                stylerList.map((val, key) => {
                  return (
                    <div key={key}>
                      <Link to={`/stylist/${btoa(val.id)}/${btoa(val.serviceName)}`}>
                        <div className="h-48 w-full rounded-t-md flex justify-center overflow-hidden">
                          <img src={val.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="bg-black rounded-b-md px-4 py-8 text-white">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{val.serviceName}</span>
                            <span>
                              <img src={arrow} alt="" className="h-8" />
                            </span>
                          </div>
                          <p className="text-sm text-white/60">
                            {val.description}
                          </p>
                        </div>
                      </Link>
                    </div>
                  )
                })
              )
              :
              (
                <div>
                 <p className="text-lg font-bold"> No professionals available yet. Check back later.</p>
                </div>
              )
          }

        </div>
      </div>
      <div className="p-4">
        <p className="text-red-500 font-semibold">Disclaimer.</p>
        <p className="text-red-400">
          Connecting with stylists outside the app can be risky. To ensure your
          safety and security, please only use our platform to book
          appointments.
        </p>
      </div>
      {locationPickerOpen && <LocationPicker onClose={() => setLocationPickerOpen(false)} />}
    </div>
  );
};

export default BookAppointment;
