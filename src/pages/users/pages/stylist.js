import RemoteLoadStatus from "../../../components/remoteLoadStatus";
import { useParams } from "react-router-dom";
// import arrow from "../assets/svg-icons/black-arrow.svg"
import ServiceCard from "../../../components/serviceCard";
import Back from "../../../components/goBack";
import { useEffect } from "react";
import { useStylerByCategoryList } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";
import { useSavedStylists } from "../../../hooks/useSavedStylists";
import { vendorOpenState } from "../../../utils/vendorOpenState";

const Stylist = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle?.("Book Appointment");
    document.title = "Select a professional | RapidStylers";
  }));
  let { stylerTypeId, stylerTypeName } = useParams();
  stylerTypeId = atob(stylerTypeId);
  stylerTypeName = atob(stylerTypeName);
  const loadState = useStylerByCategoryList(stylerTypeId, {withState:true});
  const stylerList = loadState.data ?? loadState;
  const { savedIds, loading: savedLoading, toggleSaved } = useSavedStylists();
  const reduxLoading = useSelector((state) => state.user).loading;
  if (loadState.loading || loadState.error) return <RemoteLoadStatus state={loadState} />;

  return (
    <div className="bg-white border border-black/10 rounded-lg">
      <Spinner loading={reduxLoading} />
      <div className="flex gap-2 items-center border-b border-black/10 px-4 py-4 sm:px-5">
        <Back />
        <div>
          <h1 className="text-lg font-semibold text-onSurface">{stylerTypeName}</h1>
          <p className="mt-0.5 text-sm text-black/55">Choose a professional to see their services and available times.</p>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {
          stylerList.length > 0
            ? (
              // One grid for the whole list: wrapping each card in its own grid
              // left a single huge column on desktop.
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stylerList.map((val, key) => (
                  <ServiceCard
                    key={val.stylerId || key}
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
            )
            :
            (
              <div className="text-sm text-black/60">
                No professionals available in this category yet.
              </div>
            )
        }

      </div>
    </div>
  );
};

export const StylistList = Stylist;
export default Stylist;
