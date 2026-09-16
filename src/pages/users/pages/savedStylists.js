import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import ServiceCard from "../../../components/serviceCard";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";
import { vendorOpenState } from "../../../utils/vendorOpenState";

const SavedStylist = ({ setPageTitle }) => {
  const [stylists, setStylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    setPageTitle("Saved Stylists");
    document.title = "Saved professionals | RapidStylers";
  }, [setPageTitle]);

  useEffect(() => {
    let mounted = true;
    if (!getAuthToken()) {
      setLoading(false);
      return undefined;
    }
    APIService.listSavedStylists()
      .then((response) => {
        if (mounted) setStylists(response.data?.data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const removeStylist = async (stylerId) => {
    setRemovingId(stylerId);
    try {
      await APIService.removeSavedStylist(stylerId);
      setStylists((current) => current.filter((styler) => styler.stylerId !== stylerId));
      showSuccessToastMessage("Professional removed from saved list");
    } catch (error) {
      showErrorToastMessage("Unable to remove this professional");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white">
      <div className="border-b border-black/10 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <Back />
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Your list</p>
            <h1 className="mt-2 text-[clamp(1.25rem,2.5vw,1.75rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
              Saved professionals
            </h1>
            <p className="mt-1.5 text-[13px] text-black/55">Professionals you have saved for later</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {!getAuthToken() ? (
          <p className="border-t border-black/10 py-10 text-center text-[13px] text-black/55">
            Please sign in to view saved professionals.
          </p>
        ) : loading ? (
          <p className="border-t border-black/10 py-10 text-center text-[13px] text-black/55">
            Loading saved professionals...
          </p>
        ) : stylists.length === 0 ? (
          <div className="border-t border-black/10 pt-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Nothing saved yet</p>
            <p className="mx-auto mt-3 max-w-[380px] text-[13px] leading-[1.6] text-black/55">
              You have not saved any professionals yet. Tap the bookmark on any
              professional to keep them here for later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {stylists.map((styler, index) => (
              <div key={styler.stylerId} className="relative">
                <ServiceCard
                  gridPosition={index}
                  coverImg={styler.profileImageUrl}
                  name={styler.businessName || [styler.firstname, styler.lastname].filter(Boolean).join(" ")}
                  serviceTypeName={styler.serviceTypeName || ""}
                  businessName={styler.businessName}
                  stylerId={styler.stylerId}
                  status={styler.visibilityStatus}
                  distance={styler.distanceKm}
                  rating={styler.averageRating}
                  reviews={styler.reviewCount}
                  openState={vendorOpenState(styler)}
                  payoutReady={styler.payoutReady}
                />
                <button
                  type="button"
                  className="absolute right-3 bottom-3 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-300 disabled:opacity-50"
                  onClick={() => removeStylist(styler.stylerId)}
                  disabled={removingId === styler.stylerId}
                >
                  {removingId === styler.stylerId ? "Removing..." : "Remove saved"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedStylist;
