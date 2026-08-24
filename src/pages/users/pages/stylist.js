import { useParams } from "react-router-dom";
// import arrow from "../assets/svg-icons/black-arrow.svg"
import ServiceCard from "../../../components/serviceCard";
import Back from "../../../components/goBack";
import { useEffect } from "react";
import { useStylerByCategoryList } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";
import { useSavedStylists } from "../../../hooks/useSavedStylists";

const Stylist = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle?.("Book Appointment");
    document.title = "Select a professional | RapidStylers";
  }));
  let { stylerTypeId, stylerTypeName } = useParams();
  stylerTypeId = atob(stylerTypeId);
  stylerTypeName = atob(stylerTypeName);
  const stylerList = useStylerByCategoryList(stylerTypeId);
  const { savedIds, loading: savedLoading, toggleSaved } = useSavedStylists();
  return (
    <div className="bg-white border rounded-lg">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>{stylerTypeName}s.</span>
      </div>
      <div className="p-4">
        <p className="text-black/50 mb-4 text-sm font-medium">Suggested <span className="lowercase">{stylerTypeName}</span> based on your location:</p>

        {
          stylerList.length > 0
            ? (
              stylerList.map((val, key) => {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" key={key}>
                      <ServiceCard
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
                      />
                  </div>
                )
              })
            )
            :
            (
              <div>
                No professionals available in this category yet.
              </div>
            )
        }

      </div>
    </div>
  );
};

export default Stylist;
