import { useState } from "react";
import { Link } from "react-router-dom";
import bookmark from "../assets/svg-icons/bookmark.svg";
import { cloudinaryCard } from "../utils/cloudinaryImage";
import { fallbackPhotoFor } from "../utils/curatedGallery";

/**
 * Professional card used across search / category / saved pages.
 * When the stylist has no photo, a curated sample photo from their own
 * service field renders instead of the initials tile; initials remain the
 * last resort for a stylist whose service type is unrecognised.
 * Also renders a status pill, rating chip, and optional save control.
 *
 * The payout badge says "Booking unavailable" rather than mentioning
 * payments: from a customer's point of view nothing is pending — the
 * stylist simply can't take online bookings until their payout setup is
 * complete. The full explanation lives in the tooltip and on the profile
 * page banner.
 */
const ServiceCard = ({ coverImg, name, rating, reviews, status, distance, stylerId, businessName, serviceTypeName = "", isSaved = false, onToggleSaved, saveLoading = false, payoutReady = true }) => {
  const cropped = cloudinaryCard(coverImg);
  const [imgFailed, setImgFailed] = useState(false);
  const fallback = !coverImg || imgFailed ? fallbackPhotoFor(serviceTypeName, stylerId || name) : null;
  const photoSrc = coverImg && !imgFailed ? cropped : fallback ? fallback.src : null;
  const hasRating = rating != null && Number(rating) > 0;
  const hasReviews = reviews != null && Number(reviews) > 0;
  const isOnline = status === "Online";
  const distText =
    distance != null && distance !== ""
      ? String(distance).toLowerCase().includes("km")
        ? String(distance)
        : `${distance} km`
      : null;
  const initials = (name || "R")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const card = (
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border border-black/10 bg-white transition-colors duration-300 hover:border-black/30">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={coverImg && !imgFailed ? name : `Sample photo: ${fallback.alt}`}
            className="h-full w-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-neutral">
            <div className="relative text-center">
              <p className="text-5xl font-normal text-onSurface/60">{initials}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted">Beauty studio</p>
            </div>
          </div>
        )}
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${isOnline ? "bg-white/95 text-emerald-700" : "bg-white/85 text-gray-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-300"}`} />
          {isOnline ? "Online" : "Offline"}
        </span>
        {payoutReady === false && (
          <span
            title="This professional hasn't finished payout setup, so online booking is temporarily unavailable."
            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-semibold text-white"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
            Booking unavailable
          </span>
        )}
        {stylerId && onToggleSaved && (
          <button
            type="button"
            aria-label={isSaved ? "Remove saved professional" : "Save professional"}
            title={isSaved ? "Remove saved professional" : "Save professional"}
            disabled={saveLoading}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleSaved(stylerId);
            }}
            className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 backdrop-blur transition hover:bg-white disabled:opacity-50 ${isSaved ? "ring-2 ring-black/20" : ""}`}
          >
            <img src={bookmark} alt="" className={`h-5 ${isSaved ? "opacity-100" : "opacity-45"}`} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[15px] font-medium text-onSurface">{name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 gap-y-1.5">
          {hasRating ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-onSurface"><span className="text-amber-500" aria-hidden="true">★</span> {Number(rating).toFixed(1)}</span>
          ) : (
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted">New</span>
          )}
          {hasReviews && <span className="text-xs text-black/55">{reviews} review{Number(reviews) === 1 ? "" : "s"}</span>}
          {distText && <span className="ml-auto text-xs text-black/55">{distText}</span>}
        </div>
      </div>
    </div>
  );

  if (stylerId) {
    return <Link to={`/stylistProfile/${btoa(stylerId)}/${btoa(businessName || name || "Professional")}`} className="block h-full">{card}</Link>;
  }
  return card;
};

export default ServiceCard;
