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
    ? [userLocation.city, userLocation.province].filter(Boolean).join(", ") || "Set your location"
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
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="border-b bg-gradient-to-r from-brand/5 to-white p-4 sm:p-5 rounded-t-2xl">
        <h1 className="text-[15px] font-bold text-gray-900">Book an appointment</h1>
        <p className="mt-0.5 text-xs text-gray-500">Search by name or choose a category to get started</p>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9381FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Current location:{" "}
            <span className="font-semibold text-brand">{displayLocation}</span>
          </p>
          <button
            onClick={() => setLocationPickerOpen(true)}
            className="text-sm font-medium text-brand transition hover:text-brand/80 hover:underline cursor-pointer"
          >
            Change location &rarr;
          </button>
        </div>
        <div className="mt-5">
          <label htmlFor="bookApptSearch" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Search by name
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <img src={search} alt="" className="h-4 shrink-0 opacity-40" />
              <input
                id="bookApptSearch"
                type="search"
                value={stylerName}
                onChange={(e)=>setStylerName(e.target.value)}
                onKeyDown={(e)=>{ if (e.key === "Enter") searchStyler(); }}
                className="w-full py-3 focus:outline-none placeholder:text-sm placeholder:text-gray-400 text-sm"
                placeholder="Search for a professional"
              />
            </div>
            <button onClick={searchStyler} className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 shadow-sm">
              Search
            </button>
          </div>
        </div>
        <div className="my-6">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
            or browse by category
          </p>
          <button
            type="button"
            onClick={() => navigate(systemDecideUrl())}
            className="mx-auto block w-full max-w-xs rounded-xl border border-brand/30 bg-brand/5 px-5 py-3 text-sm font-semibold text-brand transition hover:bg-brand/10"
          >
            Let the system decide
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
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center sm:col-span-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#9381FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M2 12h20" />
                      <path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    No professionals available in{" "}
                    <span className="text-brand">{displayLocation}</span>
                  </p>
                  <p className="max-w-sm text-sm text-gray-500">
                    Check back later, or try changing your location to see stylists
                    in a nearby area.
                  </p>
                  <button
                    onClick={() => setLocationPickerOpen(true)}
                    className="mt-1 flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                  >
                    Change location
                  </button>
                </div>
              )
          }

        </div>
      </div>
      <div className="rounded-b-2xl border-t border-amber-100 bg-amber-50 px-4 py-4 sm:px-6">
        <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Safety &amp; security
        </p>
        <p className="mt-1 text-sm text-amber-700">
          Connecting with stylists outside the app can be risky. To ensure your safety
          and security, please only use our platform to book appointments.
        </p>
      </div>
      {locationPickerOpen && <LocationPicker onClose={() => setLocationPickerOpen(false)} />}
    </div>
  );
};

export default BookAppointment;
