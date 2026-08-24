import bookmark from "../../../assets/svg-icons/bookmark.svg";
import SelectService from "../../../components/selectService";
import Back from "../../../components/goBack"
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSingleStylerProfile } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatAvailabilityTime = (value) => {
  const [hourText, minuteText] = String(value || "").split(":");
  const hour = Number(hourText);
  const minute = minuteText || "00";
  if (Number.isNaN(hour)) return value || "";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
};

const WorkingHours = ({ availability }) => {
  const hours = [...(availability || [])].sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek));

  return (
    <div className="rounded-xl border border-brand/15 bg-brand/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">Working hours</p>
          <p className="mt-0.5 text-xs text-gray-500">Book during these weekly windows</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand ring-1 ring-brand/15">
          Weekly
        </span>
      </div>
      {hours.length > 0 ? (
        <div className="mt-4 grid gap-2">
          {hours.map((slot) => (
            <div key={slot.dayOfWeek} className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-gray-700">{WEEKDAY_LABELS[Number(slot.dayOfWeek)] || "Day"}</span>
              <span className="text-gray-500">
                {formatAvailabilityTime(slot.startTime)} to {formatAvailabilityTime(slot.endTime)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-white/80 p-3 text-xs leading-5 text-gray-500 ring-1 ring-gray-100">
          No weekly hours set. Booking requests can still be sent for manual confirmation.
        </p>
      )}
    </div>
  );
};

const StylistProfile = ({ setPageTitle }) => {
  useEffect(() => {
    setPageTitle?.("Book Appointment");
    document.title = "Professional profile | RapidStylers";
  }, [setPageTitle]);
  let { stylerId, stylerName } = useParams();
  stylerId = atob(stylerId);
  
  const stylerProfile = useSingleStylerProfile(stylerId);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!getAuthToken()) return undefined;
    APIService.listSavedStylists()
      .then((response) => {
        if (mounted) {
          setIsSaved((response.data?.data || []).some((styler) => styler.stylerId === stylerId));
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [stylerId]);

  const toggleSaved = async () => {
    if (!getAuthToken()) {
      showErrorToastMessage("Please sign in to save professionals");
      return;
    }
    setSaveLoading(true);
    try {
      if (isSaved) {
        await APIService.removeSavedStylist(stylerId);
        setIsSaved(false);
        showSuccessToastMessage("Professional removed from saved list");
      } else {
        await APIService.saveStylist(stylerId);
        setIsSaved(true);
        showSuccessToastMessage("Professional saved");
      }
    } catch (error) {
      // APIService displays the server error.
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="bg-white border rounded-lg">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center justify-between border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <div className="flex gap-2 items-center">
          <Back />
          <span>{atob(stylerName)}</span>
        </div>
        <button
          type="button"
          onClick={toggleSaved}
          disabled={saveLoading}
          className={`rounded-md p-2 transition-colors ${isSaved ? "bg-brand/10" : "bg-transparent"}`}
          aria-label={isSaved ? "Remove saved professional" : "Save professional"}
          title={isSaved ? "Remove saved professional" : "Save professional"}
        >
          <img src={bookmark} alt="" className={`h-5 ${isSaved ? "opacity-100" : "opacity-50"}`} />
        </button>
      </div>
      <div className="p-4">
        <div className="mb-8 md:mb-4">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Address:</span>
            {stylerProfile.stylerInformation?.latitude != null && (
              <a
                href={`https://maps.google.com/?q=${stylerProfile.stylerInformation.latitude},${stylerProfile.stylerInformation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand hover:underline"
              >
                [ Get directions ]
              </a>
            )}
          </div>
          <div className="text-black/50">
            {stylerProfile.stylerInformation?.businessAddress}
          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Bio:</span>
          <p className="text-black/50">{stylerProfile.stylerInformation?.description}     </p>
        </div>
        <div className="mb-8 md:mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">{stylerProfile?.appointmentCount || 0}</p>
            <p className="text-sm text-black/50">Appointments</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">{stylerProfile?.ratingPercentage || 0}%</p>
            <p className="text-sm text-black/50">Success rate</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">{stylerProfile.stylerInformation?.reviewCount || 0}</p>
            <p className="text-sm text-black/50">Reviews</p>
          </div>
          <div className="border text-center p-3 rounded-md hover:bg-slate-50">
            <p className="text-lg text-brand">{stylerProfile.stylerInformation?.averageRating || "—"}</p>
            <p className="text-sm text-black/50">Average rating</p>
          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Services:</span>
          <div className="mt-3 grid grid-cols-1 gap-5 md:grid-cols-5 md:items-start">
            <div className="md:col-span-2">
              <WorkingHours availability={stylerProfile.availability} />
            </div>
            <div className="md:col-span-3">
              {stylerProfile.stylerSubService && stylerProfile.stylerSubService.length > 0 ? (
                stylerProfile.stylerSubService.map((val, key) => (
                  <div key={key}>
                    <SelectService
                      serviceName={val.name}
                      servicePrice={val.price}
                      durationMinutes={val.durationMinutes || 60}
                      subServiceId={val.id}
                      stylerId={stylerId}
                      stylerLatitude={stylerProfile.stylerInformation?.latitude}
                      stylerLongitude={stylerProfile.stylerInformation?.longitude}
                    />
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                  No services available yet.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Portfolio:</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {stylerProfile.stylerPortfolio && stylerProfile.stylerPortfolio.length > 0 && (
              stylerProfile.stylerPortfolio.map((val, key) => (
                <div key={key}>
                  <img src={val.imageUrl} alt={val.name} className="aspect-square rounded-md object-cover" />
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mb-8 md:mb-4">
          <span className="font-semibold">Reviews:</span>
          {stylerProfile.stylerInformation?.reviewCount > 0 ? (
            <div className="mt-4 bg-brand p-4 rounded-md flex gap-3">
              <div className="text-white font-medium">★</div>
              <div className="text-white/50">
                <span className="text-white font-semibold">{stylerProfile.stylerInformation.averageRating}</span>
                (out of 5) - Based on <span className="text-white font-semibold">{stylerProfile.stylerInformation.reviewCount}</span> review{stylerProfile.stylerInformation.reviewCount === 1 ? "" : "s"}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-black/50">No reviews yet.</p>
          )}
          {stylerProfile.stylerReviews && stylerProfile.stylerReviews.length > 0 && (
            stylerProfile.stylerReviews.map((val, key) => (
              <div className="py-4 border-b" key={key}>
                <div className="flex justify-between items-center font-semibold">
                  <span>{val.userName}</span>
                  <span className="text-brand">{val.ratingScore}</span>
                </div>
                <p className="text-black/50">{val.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StylistProfile;
