import bookmark from "../../../assets/svg-icons/bookmark.svg";
import SelectService from "../../../components/selectService";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSingleStylerProfile } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, getUserRole, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";
import { cloudinarySquare, cloudinaryAvatar } from "../../../utils/cloudinaryImage";
import { fallbackPhotoFor } from "../../../utils/curatedGallery";
import { vendorTimeZoneLabel } from "../../../utils/vendorTimeZone";
import { Section, Eyebrow, Statement, BackHome } from "../../../components/pageSections";
import SectionPager from "../../../components/sectionPager";
import Footer from "../../../components/footer";

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

const WorkingHours = ({ availability, timeZone, province }) => {
  const hours = [...(availability || [])].sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek));
  const zoneLabel = vendorTimeZoneLabel({ timeZone, province });

  return (
    <div className="border border-black/10 p-5">
      <Eyebrow>Working hours</Eyebrow>
      <p className="mt-1 text-[13px] text-black/55">
        Book during these weekly windows{zoneLabel ? ` (${zoneLabel})` : ""}
      </p>
      {hours.length > 0 ? (
        <div className="mt-4">
          {hours.map((slot) => (
            <div
              key={slot.dayOfWeek}
              className="flex items-center justify-between gap-3 border-t border-black/10 py-2.5 text-[13px]"
            >
              <span className="font-medium text-onSurface">
                {WEEKDAY_LABELS[Number(slot.dayOfWeek)] || "Day"}
              </span>
              <span className="text-black/55">
                {formatAvailabilityTime(slot.startTime)} to {formatAvailabilityTime(slot.endTime)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 border-t border-black/10 pt-4 text-[13px] leading-[1.55] text-black/55">
          No weekly hours set. Booking requests can still be sent for manual confirmation.
        </p>
      )}
    </div>
  );
};

// Empty state for a profile with no services yet. A bare "no services" line
// strands a visitor who arrived from a card or a hero pill with booking
// intent. Two audiences, one card:
//   - visitors get a way out: browse their category on /search (same
//     deep-link contract the hero pills and Discover-professionals use)
//   - a signed-in stylist viewing the profile gets the owner action instead:
//     add services from the dashboard.
const NoServicesCard = ({ categoryName, serviceTypeId }) => {
  const isStylist = getAuthToken() && getUserRole() === "STYLER";
  const browseHref = serviceTypeId
    ? `/search?serviceTypeId=${encodeURIComponent(serviceTypeId)}&serviceTypeName=${encodeURIComponent(categoryName || "")}`
    : "/search";
  return (
    <div className="border border-black/10 bg-neutral p-8">
      <Eyebrow>Nothing bookable yet</Eyebrow>
      {isStylist ? (
        <>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-black/70">
            You have no services listed, so visitors cannot book you. Add at
            least one service with a price and your working hours to appear in
            search and start taking bookings.
          </p>
          <Link
            to="/styler-dashboard/services"
            className="mt-5 inline-flex items-center rounded-full bg-[#1A1A1A] px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            Add your first service
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </>
      ) : (
        <>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-black/70">
            {categoryName
              ? `This ${categoryName.toLowerCase()} hasn't added services yet, so there is nothing to book here right now.`
              : "This professional hasn't added services yet, so there is nothing to book here right now."}
          </p>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-black/50">
            In the meantime, you can browse other professionals in the same field.
          </p>
          <Link
            to={browseHref}
            className="mt-5 inline-flex items-center rounded-full bg-[#1A1A1A] px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-85"
          >
            {categoryName ? `Browse other ${categoryName.toLowerCase()}s` : "Browse professionals"}
            <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </>
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
  const decodedName = atob(stylerName);

  const stylerProfile = useSingleStylerProfile(stylerId);
  const info = stylerProfile.stylerInformation || {};
  const categoryName = info.serviceTypeName || stylerProfile.serviceTypeName || "";
  const avatarUrl = info.profileImageUrl || stylerProfile.profileImageUrl || "";
  const displayName = info.businessName || stylerProfile.businessName || decodedName;
  const heroFallback = !avatarUrl ? fallbackPhotoFor(categoryName, stylerId, 0) : null;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const ratingLine =
    info.averageRating != null && info.reviewCount > 0
      ? `Rated ${info.averageRating} out of 5 from ${info.reviewCount} review${info.reviewCount === 1 ? "" : "s"}`
      : "New on RapidStylers";

  const stats = [
    { label: "Appointments", value: stylerProfile?.appointmentCount || 0 },
    { label: "Success rate", value: `${stylerProfile?.ratingPercentage || 0}%` },
    { label: "Reviews", value: info.reviewCount || 0 },
    { label: "Average rating", value: info.averageRating ?? "-" },
  ];

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
    <div className="min-h-screen bg-white text-onSurface">
      <Spinner loading={useSelector((state) => state.user).loading} />

      {/* Profile header: avatar, category, name, rating, address, save */}
      <Section pad="pt-10 md:pt-14 pb-10 md:pb-14">
        <BackHome />
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img
                src={cloudinaryAvatar(avatarUrl)}
                alt={displayName}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : heroFallback ? (
              <img
                src={heroFallback.src}
                alt={heroFallback.alt}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral text-xl font-semibold text-black/60">
                {initials}
              </div>
            )}
            <div>
              <Eyebrow>{categoryName || "Professional"}</Eyebrow>
              <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.08] tracking-[-0.02em]">
                {displayName}
              </h1>
              <p className="mt-2 text-[14px] text-black/55">{ratingLine}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleSaved}
            disabled={saveLoading}
            aria-pressed={isSaved}
            className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-5 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${
              isSaved ? "border-brand/40 text-brand" : "border-black/10 text-onSurface hover:border-black/30"
            }`}
          >
            <img src={bookmark} alt="" className={`h-4 ${isSaved ? "opacity-100" : "opacity-60"}`} />
            {isSaved ? "Saved" : "Save professional"}
          </button>
        </div>

        {info.description && (
          <p className="mt-6 max-w-[680px] text-[14px] leading-[1.6] text-black/60">
            {info.description}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-black/55">
          <span>{info.businessAddress}</span>
          {info.latitude != null && (
            <a
              href={`https://maps.google.com/?q=${info.latitude},${info.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand hover:underline"
            >
              Get directions
            </a>
          )}
        </div>

        {/* Honest, quiet note when online booking is not possible yet */}
        {info.payoutReady === false && (
          <p className="mt-8 max-w-[680px] rounded-lg border border-black/10 bg-neutral px-4 py-3 text-[13px] leading-[1.55] text-black/60">
            This professional hasn't finished setting up payouts yet, so online booking is temporarily unavailable.
          </p>
        )}
      </Section>

      {/* Track record: hairline stat cells on the muted band */}
      <Section muted pad="py-10 md:py-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-black/10 pt-4">
              <p className="text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-none tracking-[-0.02em]">
                {stat.value}
              </p>
              <p className="mt-2 text-[13px] text-black/55">{stat.label}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Services and hours: the conversion block */}
      <Section pad="py-16 md:py-24">
        <Eyebrow>Services</Eyebrow>
        <Statement>What you can book</Statement>
        <div className="mt-10 grid gap-10 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-3">
            {stylerProfile.stylerSubService && stylerProfile.stylerSubService.length > 0 ? (
              stylerProfile.stylerSubService.map((val, key) => (
                <div key={key}>
                  <SelectService
                    serviceName={val.name}
                    servicePrice={val.price}
                    durationMinutes={val.durationMinutes || 60}
                    subServiceId={val.id}
                    stylerId={stylerId}
                    stylerLatitude={info.latitude}
                    stylerLongitude={info.longitude}
                    stylerProvince={info.province}
                    stylerTimeZone={info.timeZone}
                    stylerAddress={info}
                  />
                </div>
              ))
            ) : (
              <NoServicesCard categoryName={categoryName} serviceTypeId={info.serviceTypeId} />
            )}
          </div>
          <div className="lg:col-span-2">
            <WorkingHours availability={stylerProfile.availability} timeZone={info.timeZone} province={info.province} />
          </div>
        </div>
      </Section>

      {/* Portfolio on the muted band */}
      <Section muted pad="py-16 md:py-24">
        <Eyebrow>Portfolio</Eyebrow>
        <Statement>Recent work</Statement>
        {portfolio.length === 0 && (
          <p className="mt-8 text-[14px] text-black/55">
            This professional has not published work photos yet.
          </p>
        )}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
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
        {portfolio.length > 0 && (
          <div className="mt-8">
            <SectionPager
              page={safePortfolioPage}
              totalPages={portfolioTotalPages}
              totalItems={portfolio.length}
              pageSize={PORTFOLIO_PAGE_SIZE}
              onPage={setPortfolioPage}
            />
          </div>
        )}
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
      </Section>

      {/* Reviews */}
      <Section pad="py-16 md:py-24">
        <Eyebrow>Reviews</Eyebrow>
        <Statement>What clients say</Statement>
        {info.reviewCount > 0 ? (
          <div className="mt-8 border-t border-black/10 pt-6">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[2.5rem] font-normal leading-none tracking-[-0.02em]">
                {info.averageRating}
              </span>
              <span className="text-[13px] text-black/55">
                out of 5, based on {info.reviewCount} review{info.reviewCount === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        ) : (
          <p className="mt-8 border-t border-black/10 pt-6 text-[14px] text-black/55">
            No reviews yet.
          </p>
        )}
        {reviews.length > 0 && (
          <div className="mt-8">
            {visibleReviews.map((val, key) => (
              <div className="border-t border-black/10 py-4" key={key}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[15px] font-medium">{val.userName}</span>
                  <span className="text-[13px] font-semibold text-brand">{val.ratingScore} / 5</span>
                </div>
                <p className="mt-1 text-[14px] leading-[1.55] text-black/55">{val.message}</p>
              </div>
            ))}
            <SectionPager
              page={safeReviewsPage}
              totalPages={reviewsTotalPages}
              totalItems={reviews.length}
              pageSize={REVIEW_PAGE_SIZE}
              onPage={setReviewsPage}
            />
          </div>
        )}
      </Section>

      <Footer />
    </div>
  );
};

export default StylistProfile;
