import search from "../../../assets/svg-icons/search.svg";
import { useEffect, useState } from "react";
import Spinner from "../../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import Back from "../../../components/goBack";
import { searchStyler } from "../../../hooks/local/userReducer";
import ServiceCard from "../../../components/serviceCard";
import { useUserLocation } from "../../../context/LocationContext";
import LocationPicker from "../../../components/locationPicker";
import { useSavedStylists } from "../../../hooks/useSavedStylists";

const SearchStyler = ({ setPageTitle, stylerSearchName }) => {
  useEffect((() => {
    setPageTitle("Book Appointment");
    document.title = "Search | RapidStylers";
  }));
  const dispatch = useDispatch();
  const { location: userLocation } = useUserLocation();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [userSearchWord, setUserSearchWord] = useState(stylerSearchName);
  const [stylerProfileData, setStylerProfileData] = useState([]);
  const { savedIds, loading: savedLoading, toggleSaved } = useSavedStylists();

  const displayLocation = userLocation
    ? [userLocation.city, userLocation.province].filter(Boolean).join(", ") || "Unknown"
    : "Detecting...";

  // Respect the chosen area: when a location is set, narrow results to that
  // province so the change has a visible effect on the results.
  const visibleResults = userLocation?.province
    ? stylerProfileData.filter(
        (s) =>
          String(s.province || "").trim().toLowerCase() ===
          String(userLocation.province).trim().toLowerCase()
      )
    : stylerProfileData;

  const searchForAStyler = async()=>{
    try{
        const { payload } = await dispatch(searchStyler(userSearchWord));
        setStylerProfileData(payload.data);
    }
    catch(e){}
  }
  useEffect(()=>{
    searchForAStyler();
    // Intentionally runs only when the parent's search term changes (or on mount).
    // Manual searches go through the Search button, so searchForAStyler is not a
    // dependency — including it (or memoizing it on userSearchWord) would fire a
    // network request on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[stylerSearchName]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center justify-between gap-3 border-b bg-gradient-to-r from-brand/5 to-white p-4 sm:p-5 rounded-t-2xl">
        <div className="flex gap-2 items-center">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Search for a professional</h1>
            <p className="mt-0.5 text-xs text-gray-500">Find the right stylist and book instantly</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9381FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Searching near{" "}
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
          <label htmlFor="searchAStylerInput" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Search by name
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <img src={search} alt="" className="h-4 shrink-0 opacity-40" />
              <input
                id="searchAStylerInput"
                type="search"
                value={userSearchWord}
                onChange={(e)=>setUserSearchWord(e.target.value)}
                onKeyDown={(e)=>{ if (e.key === "Enter") searchForAStyler(); }}
                className="w-full py-3 focus:outline-none placeholder:text-sm placeholder:text-gray-400 text-sm"
                placeholder="Search for a professional"
              />
            </div>
            <button onClick={searchForAStyler} className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand/90 shadow-sm">
              Search
            </button>
          </div>
        </div>
   
        <div className="mt-6">
        {
          visibleResults.length > 0
            ? (
              <>
                <p className="mb-4 text-sm font-medium text-gray-500">
                  {visibleResults.length} professional{visibleResults.length === 1 ? "" : "s"} found near{" "}
                  <span className="text-brand font-semibold">{displayLocation}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleResults.map((val, key) => (
                    <ServiceCard
                      key={key}
                      coverImg={val.profileImageUrl}
                      name={val.businessName}
                      status={val.visibilityStatus}
                      distance={val.distanceKm}
                      rating={val.averageRating}
                      reviews={val.reviewCount}
                      stylerId={val.stylerId}
                      businessName={val.businessName}
                      isSaved={savedIds.has(String(val.stylerId))}
                      onToggleSaved={toggleSaved}
                      saveLoading={savedLoading}
                      payoutReady={val.payoutReady}
                    />
                  ))}
                </div>
              </>
            )
            :
            (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9381FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                    <path d="M8 11h6" />
                  </svg>
                </div>
                {stylerProfileData.length > 0 ? (
                  <>
                    <p className="text-lg font-bold text-gray-800">
                      No professionals found in{" "}
                      <span className="text-brand">{displayLocation}</span>
                    </p>
                    <p className="max-w-sm text-sm text-gray-500">
                      We couldn\u2019t find any available stylists in this area right now.
                      Try changing your location or the service you\u2019re looking for.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-gray-800">
                      No professional found{userSearchWord ? (
                        <>
                          {" "}with the name{" "}
                          <span className="text-brand">&ldquo;{userSearchWord.trim()}&rdquo;</span>
                        </>
                      ) : null}
                    </p>
                    <p className="max-w-sm text-sm text-gray-500">
                      Check the spelling, or search for a different professional name.
                    </p>
                  </>
                )}
                <button
                  onClick={() => setLocationPickerOpen(true)}
                  className="mt-1 flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand/90"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
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

export default SearchStyler;
