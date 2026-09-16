import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { APIService } from "../../../hooks/remote/apiService";

/**
 * The reviews card in the dashboard's right column. It is the professional's
 * one-glance answer to "how am I rated?" and it opens the full list, so the
 * rating is a door rather than a dead number. The number shown is the approved
 * average, the same figure clients see on the public profile.
 */
const ReviewsSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    APIService.getOwnStylerReviews()
      .then((response) => setSummary(response.data?.data || null))
      .catch(() => setSummary(null))
      .finally(() => setLoaded(true));
  }, []);

  const count = Number(summary?.reviewCount || 0);
  const average = summary?.averageRating;
  const pending = Number(summary?.pendingCount || 0);

  return (
    <Link
      to="/styler-dashboard/reviews"
      className="block rounded-lg border border-black/10 bg-white transition-colors hover:border-black/25"
    >
      <p className="p-4 border-b border-black/10 text-[11px] uppercase tracking-[0.25em] text-muted truncate">
        Reviews
      </p>
      <div className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[2rem] font-normal leading-none tracking-[-0.02em]">
              {average == null ? "Not rated" : average}
            </p>
            <p className="mt-1 text-[13px] text-gray-500">
              {count === 0
                ? "No reviews yet"
                : `${count} review${count === 1 ? "" : "s"}`}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-brand">See past reviews</span>
        </div>
        {loaded && pending > 0 && (
          <p className="mt-3 text-[12px] text-amber-700">
            {pending} review{pending === 1 ? "" : "s"} still waiting on moderation.
          </p>
        )}
      </div>
    </Link>
  );
};

export default ReviewsSummary;
