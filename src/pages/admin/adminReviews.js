import { useEffect, useRef, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import { AdminInput, AdminPill } from "./adminShell";
import { formatAdminTime } from "./adminFormat";
import { showSuccessToastMessage } from "../../utils/constant";

/**
 * Reviews in three tabs: Pending (the moderation queue), Published (APPROVED)
 * and Hidden (REJECTED). Hiding a published review and restoring a hidden one
 * use the same moderation call as the queue (REJECTED / APPROVED).
 */
const TABS = [["PENDING", "Pending"], ["APPROVED", "Published"], ["REJECTED", "Hidden"]];
const PAGE_SIZE = 20;

export default function AdminReviews() {
  const [tab, setTab] = useState("PENDING");
  const [queue, setQueue] = useState([]);
  const [listing, setListing] = useState(null); // {items,total,page,size}
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const generation = useRef(0);
  const queueList = useAdminList(queue, review => [review.userName, review.businessName, review.message].filter(Boolean).join(" "));

  const load = async () => {
    const id = ++generation.current;
    setLoading(true);
    setLoadError("");
    try {
      if (tab === "PENDING") {
        const response = await APIService.adminReviewQueue();
        const data = response.data?.data;
        if (!Array.isArray(data)) throw new Error("Invalid response");
        if (id === generation.current) setQueue(data);
      } else {
        const params = { status: tab, page, size: PAGE_SIZE };
        if (appliedQuery) params.q = appliedQuery;
        const data = await AdminAPI.reviews(params);
        if (id === generation.current) setListing(data || { items: [], total: 0 });
      }
    } catch {
      if (id === generation.current) setLoadError("Unable to load reviews.");
    } finally {
      if (id === generation.current) setLoading(false);
    }
  };
  useEffect(() => { load(); }, [tab, page, appliedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchTab = value => { setTab(value); setPage(0); setQuery(""); setAppliedQuery(""); setActionError(""); };

  const moderate = async (reviewId, action, success) => {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setActionError("");
    try {
      await APIService.adminUpdateReviewModeration({ reviewId, action });
      showSuccessToastMessage(success);
      await load();
    } catch {
      setActionError("Unable to update review. Please try again.");
    } finally {
      lock.current = false;
      setPending(false);
    }
  };

  const hide = review => {
    if (!window.confirm("Hide this review? It disappears from the stylist's public profile and rating.")) return;
    moderate(review.reviewId, "REJECTED", "Review hidden");
  };

  const items = tab === "PENDING" ? queueList.visibleItems : listing?.items || [];
  const total = listing?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (listing?.size || PAGE_SIZE)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Review status">
        {TABS.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={tab === value} onClick={() => switchTab(value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab === value ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600"}`}>{label}</button>
        ))}
      </div>
      {tab === "PENDING" ? (
        !loading && !loadError && <AdminListControls list={queueList} label="Search reviews" />
      ) : (
        <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); setPage(0); setAppliedQuery(query.trim()); }}>
          <label className="min-w-0 flex-1 text-sm text-gray-600">Search reviews
            <AdminInput type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Customer, stylist or words in the review" />
          </label>
          <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Search</button>
        </form>
      )}
      {actionError && <p role="alert" className="mb-3 text-sm text-red-700">{actionError}</p>}
      {loading ? <p className="text-sm text-gray-500">Loading reviews…</p>
        : loadError ? <div role="alert">{loadError} <button type="button" onClick={load} className="underline">Retry</button></div>
        : items.length === 0 ? (
          tab === "PENDING" ? (queue.length ? <AdminNoMatches list={queueList} noun="reviews" /> : <p className="text-sm text-gray-500">No reviews awaiting moderation.</p>)
            : appliedQuery ? <p className="text-sm text-gray-500">No reviews match “{appliedQuery}”. <button type="button" className="font-semibold text-brand underline" onClick={() => { setQuery(""); setAppliedQuery(""); }}>Clear search</button></p>
            : <p className="text-sm text-gray-500">{tab === "APPROVED" ? "No published reviews." : "No hidden reviews."}</p>
        ) : (
          <div className="grid gap-3">
            {items.map(review => {
              const id = review.reviewId ?? review.id;
              return (
                <div key={id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold">{review.ratingScore}/5 · {review.userName || "Customer"}{review.businessName ? ` → ${review.businessName}` : ""}</p>
                    {tab !== "PENDING" && <AdminPill tone={tab === "APPROVED" ? "positive" : "negative"}>{tab === "APPROVED" ? "Published" : "Hidden"}</AdminPill>}
                  </div>
                  {review.createdAt && <p className="text-xs text-gray-400">{formatAdminTime(review.createdAt)}</p>}
                  <p className="mt-2 break-words text-sm text-gray-600">{review.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tab === "PENDING" && <>
                      <button type="button" disabled={pending} onClick={() => moderate(id, "APPROVED", "Review approved")} className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white">Approve</button>
                      <button type="button" disabled={pending} onClick={() => moderate(id, "REJECTED", "Review rejected")} className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white">Reject</button>
                    </>}
                    {tab === "APPROVED" && <button type="button" disabled={pending} onClick={() => hide(review)} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Hide</button>}
                    {tab === "REJECTED" && <button type="button" disabled={pending} onClick={() => moderate(id, "APPROVED", "Review restored")} className="rounded-md border px-3 py-2 text-xs font-semibold text-gray-700">Restore</button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {tab !== "PENDING" && !loading && !loadError && total > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          <button type="button" aria-label="Previous page" disabled={page <= 0} onClick={() => setPage(page - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button>
          <span aria-live="polite">{total} reviews · {page + 1} / {totalPages}</span>
          <button type="button" aria-label="Next page" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
