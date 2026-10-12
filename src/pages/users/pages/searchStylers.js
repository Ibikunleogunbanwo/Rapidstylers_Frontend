import search from "../../../assets/svg-icons/search.svg";
import { useEffect, useRef, useState } from "react";
import Spinner from "../../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import Back from "../../../components/goBack";
import { searchStyler } from "../../../hooks/local/userReducer";
import ServiceCard from "../../../components/serviceCard";
import { Link } from "react-router-dom";
import { useSavedStylists } from "../../../hooks/useSavedStylists";
import { vendorOpenState } from "../../../utils/vendorOpenState";

const SearchStyler = ({ setPageTitle, stylerSearchName }) => {
  useEffect((() => {
    setPageTitle("Book Appointment");
    document.title = "Search | RapidStylers";
  }), [setPageTitle]);
  const dispatch = useDispatch();
  const [userSearchWord, setUserSearchWord] = useState(stylerSearchName);
  const [stylerProfileData, setStylerProfileData] = useState([]);
  const [searchLoading, setSearchLoading] = useState(true);
  const [searchError, setSearchError] = useState(false);
  // The term the shown results belong to, not whatever is typed since.
  const [searchedTerm, setSearchedTerm] = useState("");
  const searchRequest = useRef(0);
  const { savedIds, loading: savedLoading, toggleSaved } = useSavedStylists();

  // A name search covers every professional, wherever they are: someone who
  // knows who they want must find them even when the chosen location (or one
  // detected outside Canada) is somewhere else. Location only shapes browsing.
  const visibleResults = stylerProfileData;

  const searchForAStyler = async (term = userSearchWord) => {
    const request = ++searchRequest.current;
    setSearchLoading(true);
    setSearchError(false);
    try {
      const action = await dispatch(searchStyler(term));
      if (action.meta?.requestStatus === "rejected" || action.error || !Array.isArray(action.payload?.data)) throw new Error("Search failed");
      if (request === searchRequest.current) {
        setStylerProfileData(action.payload.data);
        setSearchedTerm(String(term || "").trim());
      }
    } catch (error) {
      if (request === searchRequest.current) setSearchError(true);
    } finally {
      if (request === searchRequest.current) setSearchLoading(false);
    }
  };
  useEffect(() => {
    setUserSearchWord(stylerSearchName || "");
    searchForAStyler(stylerSearchName || "");
    return () => { searchRequest.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stylerSearchName]);

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
            <p className="mt-1.5 text-[13px] text-black/55">Search every professional on RapidStylers by name or business name</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        <div>
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
            <button onClick={() => searchForAStyler()} className="shrink-0 rounded-full bg-[#1A1A1A] px-7 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-85">
              Search
            </button>
          </div>
        </div>

        <div className="mt-8">
        {
          searchLoading ? <p role="status">Searching professionals...</p> : searchError ? <div role="alert">Unable to search professionals. <button type="button" onClick={() => searchForAStyler()}>Retry</button></div> : visibleResults.length > 0
            ? (
              <>
                <p className="mb-4 text-[13px] text-black/55">
                  {visibleResults.length} professional{visibleResults.length === 1 ? "" : "s"} found
                  {searchedTerm ? <> for <span className="font-semibold text-onSurface">&ldquo;{searchedTerm}&rdquo;</span></> : null}
                  {" "}across Canada
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
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted">No results</p>
                <p className="mx-auto mt-3 max-w-sm text-[13px] leading-[1.6] text-black/55">
                  No professional found{searchedTerm ? (
                    <>
                      {" "}with the name{" "}
                      <span className="font-semibold text-onSurface">&ldquo;{searchedTerm}&rdquo;</span>
                    </>
                  ) : null}. Check the spelling, or search for a different
                  professional name.
                </p>
                <Link
                  to="/bookAppointment"
                  className="mt-5 inline-block rounded-full border border-black/10 px-6 py-2.5 text-[13px] font-semibold text-onSurface transition-colors hover:border-black/30"
                >
                  Browse by service
                </Link>
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
          Connecting with professionals outside the app can be risky. To ensure your safety
          and security, please only use our platform to book appointments.
        </p>
      </div>
    </div>
  );
};

export default SearchStyler;
