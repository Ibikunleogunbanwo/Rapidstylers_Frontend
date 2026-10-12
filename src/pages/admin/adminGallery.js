import { useEffect, useRef, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { requestError } from "../../hooks/remote/marketplaceApi";
import { AdminCard, AdminPill, AdminTextarea } from "./adminShell";
import { formatAdminTime } from "./adminFormat";
import { showSuccessToastMessage } from "../../utils/constant";

/**
 * The gallery moderation queue. A stylist's new portfolio photo waits as
 * PENDING until an admin approves it into the public gallery or rejects it with
 * a note the stylist is emailed. Any photo opens full size, with its decision
 * history, before a decision is made.
 */
const STATES = [["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["ALL", "All"]];
const TONES = { PENDING: "attention", APPROVED: "positive", REJECTED: "negative" };
const PAGE_SIZE = 24;

const stylistName = img => img.businessName || [img.firstname, img.lastname].filter(Boolean).join(" ") || "Stylist";

export default function AdminGallery() {
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [rejectDraft, setRejectDraft] = useState(null); // {id, note}
  const [preview, setPreview] = useState(null);
  const writeLock = useRef(false);
  const generation = useRef(0);

  const load = async (nextStatus = status, nextPage = page) => {
    const id = ++generation.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await AdminAPI.galleryModeration({ status: nextStatus, page: nextPage, size: PAGE_SIZE });
      if (id === generation.current) setData(result || { items: [] });
    } catch {
      if (id === generation.current) { setData(null); setLoadError("Unable to load gallery images."); }
    } finally {
      if (id === generation.current) setLoading(false);
    }
  };

  useEffect(() => { load(status, page); }, [status, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (img, run, success) => {
    if (writeLock.current) return;
    writeLock.current = true;
    setActionError("");
    setBusyId(img.id);
    try {
      await run();
      showSuccessToastMessage(success);
      setRejectDraft(null);
      setPreview(null);
      await load();
    } catch (error) {
      setActionError(requestError(error));
    } finally {
      writeLock.current = false;
      setBusyId(null);
    }
  };

  const approve = img => act(img, () => AdminAPI.approveGalleryImage(img.id), "Photo approved into the gallery");
  const reject = img => {
    const note = rejectDraft?.id === img.id ? rejectDraft.note.trim() : "";
    if (!note) { setActionError("Say why the photo is rejected; the stylist will see this note."); return; }
    act(img, () => AdminAPI.rejectGalleryImage(img.id, note), "Photo rejected and stylist notified");
  };
  const remove = img => {
    if (writeLock.current || !window.confirm("Delete this image from the gallery? The stylist will be emailed.")) return;
    act(img, () => APIService.adminDeletePortfolioImage(img.id), "Image removed and stylist notified");
  };

  const writing = busyId !== null;
  const items = data?.items || [];
  const counts = data?.counts || {};
  const totalPages = Math.max(1, data?.totalPages || 1);

  const actions = img => (
    <div className="grid gap-2">
      {rejectDraft?.id === img.id ? (
        <div className="grid gap-2">
          <label htmlFor={`reject-note-${img.id}`} className="text-xs text-gray-600">Reason (emailed to the stylist)</label>
          <AdminTextarea id={`reject-note-${img.id}`} rows={2} maxLength={500} value={rejectDraft.note} disabled={writing}
            onChange={e => setRejectDraft({ id: img.id, note: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={writing || !rejectDraft.note.trim()} onClick={() => reject(img)} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
              {busyId === img.id ? "Rejecting…" : "Confirm reject"}
            </button>
            <button type="button" disabled={writing} onClick={() => setRejectDraft(null)} className="rounded-md border px-3 py-1.5 text-xs font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {img.moderationStatus !== "APPROVED" && (
            <button type="button" disabled={writing} onClick={() => approve(img)} className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60">
              {busyId === img.id ? "Saving…" : "Approve"}
            </button>
          )}
          {img.moderationStatus !== "REJECTED" && (
            <button type="button" disabled={writing} onClick={() => { setActionError(""); setRejectDraft({ id: img.id, note: "" }); }} className="rounded-md bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60">
              Reject
            </button>
          )}
        </div>
      )}
      <button type="button" onClick={() => remove(img)} disabled={writing} className="w-full rounded-md border border-red-200 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60">
        {busyId === img.id && !rejectDraft ? "Deleting…" : "Delete image"}
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Photo status">
        {STATES.map(([value, label]) => (
          <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); setPage(0); setRejectDraft(null); }}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${status === value ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600 hover:border-brand"}`}>
            {label}{counts[value] !== undefined ? ` (${counts[value]})` : ""}
          </button>
        ))}
      </div>
      {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading images…</p>
      ) : loadError ? (
        <div role="alert">{loadError} <button type="button" onClick={() => load()} className="underline">Retry</button></div>
      ) : items.length === 0 ? (
        <AdminCard pad="p-8" className="text-center">
          <p className="text-sm text-gray-500">
            {status === "PENDING" ? "No photos waiting for review. New portfolio photos appear here until you approve or reject them." : "No photos in this view."}
          </p>
        </AdminCard>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map(img => (
              <AdminCard key={img.id} pad="p-0" className="overflow-hidden">
                <button type="button" onClick={() => setPreview(img)} className="relative block h-40 w-full bg-gray-100" aria-label={`Preview full size: ${img.category || "portfolio photo"} by ${stylistName(img)}`}>
                  <img src={img.imageUrl} alt={img.category || "Portfolio image"} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{img.category || "-"}</span>
                </button>
                <div className="grid gap-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm text-gray-900">{stylistName(img)}</p>
                    <AdminPill tone={TONES[img.moderationStatus] || "neutral"}>{img.moderationStatus || "-"}</AdminPill>
                  </div>
                  <p className="break-all text-xs text-gray-500">{img.emailAddress || ""}</p>
                  <p className="text-xs text-gray-400">Uploaded {formatAdminTime(img.createdAt)}</p>
                  {img.moderationNote && <p className="text-xs text-gray-600">Note: {img.moderationNote}</p>}
                  <div className="mt-2">{actions(img)}</div>
                </div>
              </AdminCard>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <button type="button" aria-label="Previous page" disabled={page <= 0} onClick={() => setPage(page - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button>
            <span aria-live="polite">{data?.total ?? items.length} photos · {page + 1} / {totalPages}</span>
            <button type="button" aria-label="Next page" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button>
          </div>
        </>
      )}
      {preview && <GalleryPreview image={preview} onClose={() => setPreview(null)} actions={actions(preview)} />}
    </div>
  );
}

/** Full-size photo with its details and decision history. */
function GalleryPreview({ image, onClose, actions }) {
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    const onKey = event => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    AdminAPI.galleryImageHistory(image.id)
      .then(result => { if (!cancelled) setHistory(result?.history || []); })
      .catch(() => { if (!cancelled) setHistoryError("Decision history is unavailable."); });
    return () => { cancelled = true; };
  }, [image.id]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="gallery-preview-title" onClick={e => e.stopPropagation()} className="max-h-full w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="gallery-preview-title" className="text-lg font-medium text-gray-900">{image.category || "Portfolio photo"} · {stylistName(image)}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close preview" className="rounded-md border px-3 py-1.5 text-sm">Close</button>
        </div>
        <img src={image.imageUrl} alt={image.category || "Portfolio image"} className="mx-auto max-h-[70vh] w-auto max-w-full object-contain" />
        <p className="mt-3 text-sm text-gray-600">Uploaded {formatAdminTime(image.createdAt)} · {image.emailAddress || "no email"} · <a href={image.imageUrl} target="_blank" rel="noreferrer" className="text-brand underline">Open original</a></p>
        <div className="mt-3 max-w-md">{actions}</div>
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-800">Decision history</p>
          {historyError ? <p className="text-sm text-gray-500">{historyError}</p> : !history ? <p className="text-sm text-gray-500">Loading…</p> : history.length === 0 ? <p className="text-sm text-gray-500">No decisions yet.</p> : (
            <ul className="mt-1 grid gap-1 text-xs text-gray-600">
              {history.map(entry => <li key={entry.id}>{formatAdminTime(entry.createdAt)} · {entry.actorEmail || entry.actorRole} · {entry.action}{entry.details ? ` · ${entry.details}` : ""}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
