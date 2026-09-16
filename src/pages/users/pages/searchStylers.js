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
import { vendorOpenState } from "../../../utils/vendorOpenState";

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
    ? [userLocation.city, userLocation.province].filter(Boolean).join(", ") || "Set your location"
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
    <div className="rounded-lg border border-black/10 bg-white">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="border-b border-black/10 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <Back />
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Find and book</p>
            <h1 className="mt-2 text-[clamp(1.25rem,2.5vw,1.75rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
              Search for a professional
            </h1>
            <p className="mt-1.5 text-[13px] text-black/55">Find the right stylist and book instantly</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-2 border-b border-black/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[13px] text-black/60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-black/40" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Searching near{" "}
            <span className="font-semibold text-onSurface">{displayLocation}</span>
          </p>
          <button
            onClick={() => setLocationPickerOpen(true)}
            className="text-[13px] font-semibold text-black/55 transition hover:text-brand cursor-pointer"
          >
            Change location &rarr;
          </button>
        </div>
        <div className="mt-6">
          <label htmlFor="searchAStylerInput" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">
            Search by name
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-full border border-black/10 bg-white px-5 transition focus-within:border-brand">
              <img src={search} alt="" className="h-4 shrink-0 opacity-40" />
              <input
                id="searchAStylerInput"
                type="search"
                value={userSearchWord}
                onChange={(e)=>setUserSearchWord(e.target.value)}
                onKeyDown={(e)=>{ if (e.key === "Enter") searchForAStyler(); }}
                className="w-full py-3 focus:outline-none placeholder:text-sm placeholder:text-black/40 text-sm"
                placeholder="Search for a professional"
              />
            </div>
            <button onClick={searchForAStyler} className="shrink-0 rounded-full bg-[#1A1A1A] px-7 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-85">
              Search
            </button>
          </div>
        </div>

        <div className="mt-8">
        {
          visibleResults.length > 0
            ? (
              <>
                <p className="mb-4 text-[13px] text-black/55">
                  {visibleResults.length} professional{visibleResults.length === 1 ? "" : "s"} found near{" "}
                  <span className="font-semibold text-onSurface">{displayLocation}</span>
                </p>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {visibleResults.map((val, key) => (
                    <ServiceCard
                      key={key}
                      gridPosition={key}
                      coverImg={val.profileImageUrl}
                      name={val.businessName}
                      serviceTypeName={val.serviceTypeName || ""}
                      status={val.visibilityStatus}
                      distance={val.distanceKm}
                      rating={val.averageRating}
                      reviews={val.reviewCount}
                      openState={vendorOpenState(val)}
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
              <div className="border-t border-black/10 pt-12 text-center">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
                  {stylerProfileData.length > 0 ? "Nothing in this area" : "No results"}
                </p>
                {stylerProfileData.length > 0 ? (
                  <p className="mx-auto mt-3 max-w-sm text-[13px] leading-[1.6] text-black/55">
                    No professionals found in {displayLocation} right now. Try
                    changing your location or the service you are looking for.
                  </p>
                ) : (
                  <p className="mx-auto mt-3 max-w-sm text-[13px] leading-[1.6] text-black/55">
                    No professional found{userSearchWord ? (
                      <>
                        {" "}with the name{" "}
                        <span className="font-semibold text-onSurface">&ldquo;{userSearchWord.trim()}&rdquo;</span>
                      </>
                    ) : null}. Check the spelling, or search for a different
                    professional name.
                  </p>
                )}
                <button
                  onClick={() => setLocationPickerOpen(true)}
                  className="mt-5 rounded-full border border-black/10 px-6 py-2.5 text-[13px] font-semibold text-onSurface transition-colors hover:border-black/30"
                >
                  Change location
                </button>
              </div>
            )
        }

        </div>
      </div>
      <div className="rounded-b-lg border-t border-amber-100 bg-amber-50 px-5 py-4 sm:px-6">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Safety &amp; security
        </p>
        <p className="mt-1 text-[13px] leading-[1.6] text-amber-700">
          Connecting with stylists outside the app can be risky. To ensure your safety
          and security, please only use our platform to book appointments.
        </p>
      </div>
      {locationPickerOpen && <LocationPicker onClose={() => setLocationPickerOpen(false)} />}
    </div>
  );
};

export default SearchStyler;
