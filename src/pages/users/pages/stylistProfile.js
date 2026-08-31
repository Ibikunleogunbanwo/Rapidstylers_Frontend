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
import { cloudinarySquare } from "../../../utils/cloudinaryImage";
import SectionPager from "../../../components/sectionPager";

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

const PORTFOLIO_PAGE_SIZE = 9;
const REVIEW_PAGE_SIZE = 5;

// Full-size portfolio photo viewer with prev/next across the whole set.
// Closes on Escape, click-outside, or the close button; arrows navigate.
const PortfolioLightbox = ({ images, index, onClose, onPrev, onNext }) => {
  useEffect(() => {
    if (index === null) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") onNext();
      else if (event.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKeyDown);
    // Lock body scroll while the lightbox is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [index, onClose, onPrev, onNext]);

  if (index === null || !images[index]) return null;
  const image = images[index];
  const hasMultiple = images.length > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio photo viewer"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 md:p-10"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo viewer"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white transition-colors hover:bg-white/20"
      >
        ✕
      </button>
      {hasMultiple && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onPrev(); }}
          aria-label="Previous photo"
          className="absolute left-3 md:left-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
        >
          ←
        </button>
      )}
      <figure
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-full max-w-full flex-col items-center"
      >
        <img
          src={image.imageUrl}
          alt={image.name}
          className="max-h-[78vh] max-w-full rounded-md object-contain"
        />
        <figcaption className="mt-4 text-center text-sm text-white/80">
          {image.name}
          {hasMultiple && (
            <span className="ml-2 text-white/50">
              {index + 1} / {images.length}
            </span>
          )}
        </figcaption>
      </figure>
      {hasMultiple && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); onNext(); }}
          aria-label="Next photo"
          className="absolute right-3 md:right-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition-colors hover:bg-white/20"
        >
          →
        </button>
      )}
    </div>
  );
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
  const [portfolioPage, setPortfolioPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  // Index into the full portfolio array of the photo shown in the lightbox.
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Reset pagination when viewing a different stylist.
  useEffect(() => {
    setPortfolioPage(1);
    setReviewsPage(1);
  }, [stylerId]);

  const portfolio = stylerProfile.stylerPortfolio || [];
  const reviews = stylerProfile.stylerReviews || [];
  const portfolioTotalPages = Math.max(1, Math.ceil(portfolio.length / PORTFOLIO_PAGE_SIZE));
  const reviewsTotalPages = Math.max(1, Math.ceil(reviews.length / REVIEW_PAGE_SIZE));
  const safePortfolioPage = Math.min(portfolioPage, portfolioTotalPages);
  const safeReviewsPage = Math.min(reviewsPage, reviewsTotalPages);
  const visiblePortfolio = portfolio.slice(
    (safePortfolioPage - 1) * PORTFOLIO_PAGE_SIZE,
    safePortfolioPage * PORTFOLIO_PAGE_SIZE
  );
  const visibleReviews = reviews.slice(
    (safeReviewsPage - 1) * REVIEW_PAGE_SIZE,
    safeReviewsPage * REVIEW_PAGE_SIZE
  );

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
        {stylerProfile.stylerInformation?.payoutReady === false && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
            <div>
              <p className="text-sm font-bold text-amber-800">Payments pending</p>
              <p className="text-xs text-amber-700">
                This professional hasn't finished setting up payouts yet, so online booking is temporarily unavailable.
              </p>
            </div>
          </div>
        )}
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
            {portfolio.length > 0 &&
              visiblePortfolio.map((val, key) => (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((safePortfolioPage - 1) * PORTFOLIO_PAGE_SIZE + key)
                    }
                    aria-label={`View ${val.name} full size`}
                    className="block w-full cursor-zoom-in overflow-hidden rounded-md"
                  >
                    <img
                      src={cloudinarySquare(val.imageUrl)}
                      alt={val.name}
                      className="aspect-square w-full rounded-md object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </button>
                </div>
              ))}
          </div>
          <SectionPager
            page={safePortfolioPage}
            totalPages={portfolioTotalPages}
            totalItems={portfolio.length}
            pageSize={PORTFOLIO_PAGE_SIZE}
            onPage={setPortfolioPage}
          />
          <PortfolioLightbox
            images={portfolio}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onPrev={() =>
              setLightboxIndex((i) =>
                i === null ? null : (i - 1 + portfolio.length) % portfolio.length
              )
            }
            onNext={() =>
              setLightboxIndex((i) => (i === null ? null : (i + 1) % portfolio.length))
            }
          />
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
          {reviews.length > 0 && (
            <>
              {visibleReviews.map((val, key) => (
                <div className="py-4 border-b" key={key}>
                  <div className="flex justify-between items-center font-semibold">
                    <span>{val.userName}</span>
                    <span className="text-brand">{val.ratingScore}</span>
                  </div>
                  <p className="text-black/50">{val.message}</p>
                </div>
              ))}
              <SectionPager
                page={safeReviewsPage}
                totalPages={reviewsTotalPages}
                totalItems={reviews.length}
                pageSize={REVIEW_PAGE_SIZE}
                onPage={setReviewsPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StylistProfile;
