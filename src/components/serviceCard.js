import { useState } from "react";
import { Link } from "react-router-dom";
import bookmark from "../assets/svg-icons/bookmark.svg";

/**
 * Professional card used across search / category / saved pages.
 * Renders an elegant initials placeholder when the stylist has no photo,
 * a status pill, rating chip, and optional save control.
 */
const ServiceCard = ({ coverImg, name, rating, reviews, status, distance, stylerId, businessName, isSaved = false, onToggleSaved, saveLoading = false, payoutReady = true }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImg = coverImg && !imgFailed;
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
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_1px_3px_rgba(20,20,43,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-[0_14px_36px_rgba(147,129,255,0.22)]">
      <div className="relative h-[190px] overflow-hidden">
        {hasImg ? (
          <img src={coverImg} alt={name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" onError={() => setImgFailed(true)} />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#9381FF]/25 via-[#EBE6FF] to-[#F6F3FF]">
            <div className="relative text-center">
              <p className="font-serif text-5xl font-bold text-[#9381FF] drop-shadow-sm">{initials}</p>
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9381FF]/60">Beauty studio</p>
            </div>
          </div>
        )}
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${isOnline ? "bg-white/95 text-emerald-700" : "bg-white/85 text-gray-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-gray-300"}`} />
          {isOnline ? "Online" : "Offline"}
        </span>
        {payoutReady === false && (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
            Payments pending
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
            className={`absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white disabled:opacity-50 ${isSaved ? "ring-2 ring-brand/40" : ""}`}
          >
            <img src={bookmark} alt="" className={`h-5 ${isSaved ? "opacity-100" : "opacity-45"}`} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="truncate text-[15px] font-bold text-gray-900">{name}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          {hasRating ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 ring-1 ring-amber-100"><span className="text-amber-500">★</span> {Number(rating).toFixed(1)}</span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand">New</span>
          )}
          {hasReviews && <span className="text-xs text-gray-400">{reviews} review{Number(reviews) === 1 ? "" : "s"}</span>}
          {distText && <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand"><span aria-hidden="true">⌖</span>{distText}</span>}
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
