import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import ServiceCard from "../../../components/serviceCard";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";

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
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Saved stylists</h1>
            <p className="mt-0.5 text-xs text-gray-500">Professionals you have saved for later</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        {!getAuthToken() ? (
          <p className="text-sm text-gray-500">Please sign in to view saved professionals.</p>
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading saved professionals...</p>
        ) : stylists.length === 0 ? (
          <p className="text-sm text-gray-500">You have not saved any professionals yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stylists.map((styler) => (
              <div key={styler.stylerId} className="relative">
                <ServiceCard
                  coverImg={styler.profileImageUrl}
                  name={styler.businessName || [styler.firstname, styler.lastname].filter(Boolean).join(" ")}
                  businessName={styler.businessName}
                  stylerId={styler.stylerId}
                  status={styler.visibilityStatus}
                  distance={styler.distanceKm}
                  rating={styler.averageRating}
                  reviews={styler.reviewCount}
                  payoutReady={styler.payoutReady}
                />
                <button
                  type="button"
                  className="absolute right-3 bottom-3 rounded-md bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow ring-1 ring-rose-100 disabled:opacity-50"
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
