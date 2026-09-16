import { useEffect, useState } from "react";
import Spinner from "../../components/spinner";
import SectionPager from "../../components/sectionPager";
import { APIService } from "../../hooks/remote/apiService";

const REVIEW_PAGE_SIZE = 5;

/**
 * "2026-09-01 10:00:00" renders as a short, readable date in the viewer's
 * locale ("Sep 1, 2026"). Built from the parts rather than Date.parse, so a
 * value near midnight never slips a day across zones.
 */
export const formatReviewDate = (value) => {
  const [datePart] = String(value || "").trim().split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return "";
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

/**
 * The professional's own reviews. It shows exactly what the public profile
 * shows (approved reviews, averaged to one decimal) and is honest about the
 * rows that are not public yet, because a stylist told "you have a new review"
 * should never find an empty page.
 */
const Reviews = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = "Reviews | RapidStylers";
    APIService.getOwnStylerReviews()
      .then((response) => setSummary(response.data?.data || null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-10">
        <Spinner loading={loading} />
        <div className="text-center text-sm text-black/50">Loading your reviews...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white rounded-lg border p-10 text-center text-sm text-black/50">
        Could not load your reviews. Refresh the page to try again.
      </div>
    );
  }

  const reviews = Array.isArray(summary.reviews) ? summary.reviews : [];
  const reviewCount = Number(summary.reviewCount ?? reviews.length) || 0;
  const pendingCount = Number(summary.pendingCount || 0);
  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEW_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleReviews = reviews.slice(
    (safePage - 1) * REVIEW_PAGE_SIZE,
    safePage * REVIEW_PAGE_SIZE
  );

  return (
    <div className="bg-white rounded-lg border">
      <p className="p-4 border-b border-black/10 text-[11px] uppercase tracking-[0.25em] text-muted">
        Reviews
      </p>
      <div className="p-4">
        {reviewCount > 0 ? (
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-black/10 pb-6">
            <span className="text-[2.5rem] font-normal leading-none tracking-[-0.02em]">
              {summary.averageRating == null ? "Not rated" : summary.averageRating}
            </span>
            <span className="text-[13px] text-black/55">
              out of 5, based on {reviewCount} review{reviewCount === 1 ? "" : "s"}
            </span>
            <span className="text-[13px] text-black/40">
              This is what clients see on your public profile.
            </span>
          </p>
        ) : (
          <div className="border-b border-black/10 pb-6">
            <p className="text-[15px] font-medium">No reviews yet</p>
            <p className="mt-1 text-[14px] leading-[1.55] text-black/55">
              Reviews appear here once a client reviews a completed appointment. Completed
              appointments are the only ones a client can review, so keep them marked finished
              in your appointments list.
            </p>
          </div>
        )}

        {pendingCount > 0 && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            {pendingCount} review{pendingCount === 1 ? "" : "s"} waiting on moderation. Reviews
            become public once they are checked.
          </p>
        )}

        {reviews.length > 0 && (
          <div className="mt-2">
            {visibleReviews.map((review, index) => {
              const date = formatReviewDate(review.createdAt);
              return (
                <div
                  className="border-b border-black/10 py-4 last:border-0"
                  key={review.bookingId || `${review.userId || "review"}-${safePage}-${index}`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[15px] font-medium">{review.userName}</span>
                    <span className="shrink-0 text-[13px] font-semibold text-brand">
                      {review.ratingScore} / 5
                    </span>
                  </div>
                  {review.message && (
                    <p className="mt-1 text-[14px] leading-[1.55] text-black/55">{review.message}</p>
                  )}
                  {date && <p className="mt-1 text-[12px] text-black/40">{date}</p>}
                </div>
              );
            })}
            <SectionPager
              page={safePage}
              totalPages={totalPages}
              totalItems={reviews.length}
              pageSize={REVIEW_PAGE_SIZE}
              onPage={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
