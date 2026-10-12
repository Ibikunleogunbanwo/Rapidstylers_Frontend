import { Fragment, useEffect, useRef, useState } from "react";
import { AdminAPI, saveFile } from "../../hooks/remote/adminApi";
import { requestError } from "../../hooks/remote/marketplaceApi";
import { AdminInput, AdminPill, AdminStat } from "./adminShell";
import { formatAdminTime, formatMoney } from "./adminFormat";

/**
 * Bookings and payments: every booking with its customer, stylist and payment,
 * filtered on the server (the same filters drive the totals and the CSV), with
 * revenue for the chosen dates and a Refund action that pre-fills the refund
 * form on the Refunds tab.
 */
const STATUSES = ["PENDING", "ACCEPTED", "COMPLETED", "DECLINED", "CANCELLED"];
const PAYMENT_STATUSES = ["AUTHORIZED", "CAPTURED", "REFUNDED", "PAYMENT_FAILED", "PAYMENT_SCHEDULED", "RELEASED", "DISPUTED"];
const PAGE_SIZE = 25;
const EMPTY_FILTERS = { appointmentId: "", status: "", paymentStatus: "", from: "", to: "" };
const STATUS_TONES = { COMPLETED: "positive", ACCEPTED: "positive", PENDING: "attention", DECLINED: "negative", CANCELLED: "neutral" };
/** Only a captured payment has money to give back; refund_context re-checks before anything is sent. */
export const isRefundable = row => row.paymentStatus === "CAPTURED";

const params = filters => Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value.trim()]).filter(([, value]) => value));

export default function AdminBookings({ onRefund }) {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [openId, setOpenId] = useState(null);
  const generation = useRef(0);

  const load = async () => {
    const id = ++generation.current;
    setLoading(true);
    setLoadError("");
    try {
      const result = await AdminAPI.bookings({ ...params(filters), page, size: PAGE_SIZE });
      if (id === generation.current) setData(result || { items: [] });
    } catch (error) {
      if (id === generation.current) { setData(null); setLoadError(`Unable to load bookings. ${requestError(error)}`); }
    } finally {
      if (id === generation.current) setLoading(false);
    }
    // Revenue is a side panel: its failure must not hide the bookings.
    AdminAPI.revenue(params({ from: filters.from, to: filters.to }))
      .then(result => { if (id === generation.current) setRevenue(result); })
      .catch(() => { if (id === generation.current) setRevenue(null); });
  };
  useEffect(() => { load(); }, [filters, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = event => {
    event.preventDefault();
    if (draft.from && draft.to && draft.from > draft.to) { setLoadError("The From date must be on or before the To date."); return; }
    setPage(0);
    setOpenId(null);
    setFilters({ ...draft });
  };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      saveFile(await AdminAPI.bookingsExport(params(filters)));
    } catch (error) {
      setExportError(`Export failed. ${requestError(error)}`);
    } finally {
      setExporting(false);
    }
  };

  const items = data?.items || [];
  const totals = data?.totals;
  const totalPages = Math.max(1, data?.totalPages || 1);
  const summary = revenue?.summary;
  const set = key => event => setDraft({ ...draft, [key]: event.target.value });

  return (
    <div className="grid gap-4">
      <form onSubmit={apply} className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
        <label className="grid gap-1 text-xs text-gray-500 lg:col-span-2">Appointment id
          <AdminInput value={draft.appointmentId} onChange={set("appointmentId")} placeholder="e.g. aB3xY" />
        </label>
        <label className="grid gap-1 text-xs text-gray-500">Booking status
          <select value={draft.status} onChange={set("status")} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
            <option value="">All</option>
            {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-gray-500">Payment status
          <select value={draft.paymentStatus} onChange={set("paymentStatus")} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900">
            <option value="">All</option>
            {PAYMENT_STATUSES.map(status => <option key={status} value={status}>{status.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-gray-500">From
          <AdminInput type="date" value={draft.from} onChange={set("from")} />
        </label>
        <label className="grid gap-1 text-xs text-gray-500">To
          <AdminInput type="date" value={draft.to} onChange={set("to")} />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-6">
          <button type="submit" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Apply filters</button>
          <button type="button" onClick={() => { setDraft(EMPTY_FILTERS); setFilters(EMPTY_FILTERS); setPage(0); }} className="rounded-md border px-4 py-2 text-sm">Clear</button>
          <button type="button" onClick={exportCsv} disabled={exporting} className="rounded-md border px-4 py-2 text-sm disabled:opacity-60">{exporting ? "Exporting…" : "Export CSV"}</button>
        </div>
      </form>
      {exportError && <p role="alert" className="text-sm text-red-700">{exportError}</p>}

      {(totals || summary) && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {totals && <AdminStat label="Bookings" value={Number(totals.count || 0).toLocaleString()} hint={`Value ${formatMoney(totals.bookingValue)}`} />}
          {summary && <AdminStat label="Captured" value={formatMoney(summary.capturedValue)} hint={`${summary.charges ?? 0} charges${revenue.from ? ` · ${revenue.from} to ${revenue.to}` : ""}`} />}
          {summary && <AdminStat label="Refunded" value={formatMoney(summary.refunds)} hint={`Net ${formatMoney(summary.netValue)}`} />}
          {summary && <AdminStat label="Platform revenue" value={formatMoney(summary.platformRevenue)} hint={`Stylists ${formatMoney(summary.stylistEarnings)}`} />}
        </div>
      )}

      {loading ? <p className="text-sm text-gray-500">Loading bookings…</p>
        : loadError ? <div role="alert">{loadError} <button type="button" onClick={load} className="underline">Retry</button></div>
        : items.length === 0 ? <p className="text-sm text-gray-500">No bookings match these filters.</p>
        : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="p-3">Appointment</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Stylist</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment</th>
                  <th className="p-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {items.map(row => (
                  <Fragment key={row.appointmentId}>
                    <tr className="border-b align-top">
                      <td className="p-3"><p className="font-semibold">{row.appointmentId}</p><p className="text-xs text-gray-500">{row.appointmentDate} {row.startTime || ""}</p></td>
                      <td className="p-3"><p>{row.customer?.name || "-"}</p><p className="break-all text-xs text-gray-500">{row.customer?.email || ""}</p></td>
                      <td className="p-3">{row.stylist?.name || row.stylist?.stylerId || "-"}</td>
                      <td className="p-3">{row.service?.name || row.service?.serviceType || "-"}</td>
                      <td className="p-3"><AdminPill tone={STATUS_TONES[row.status] || "neutral"}>{row.status}</AdminPill></td>
                      <td className="p-3"><p>{formatMoney(row.paymentAmount ?? row.price)}</p><p className="text-xs text-gray-500">{String(row.paymentStatus || "-").replace(/_/g, " ")}</p></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => setOpenId(openId === row.appointmentId ? null : row.appointmentId)} aria-expanded={openId === row.appointmentId} className="rounded-md border px-3 py-1.5 text-xs font-semibold">Details</button>
                          {isRefundable(row) && <button type="button" onClick={() => onRefund(row)} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white">Refund</button>}
                        </div>
                      </td>
                    </tr>
                    {openId === row.appointmentId && <tr className="border-b bg-gray-50"><td colSpan={7} className="p-3"><BookingDetail appointmentId={row.appointmentId} /></td></tr>}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {!loading && !loadError && items.length > 0 && (
        <div className="flex items-center gap-2 text-xs">
          <button type="button" aria-label="Previous page" disabled={page <= 0} onClick={() => setPage(page - 1)} className="rounded border px-3 py-2 disabled:opacity-40">Previous</button>
          <span aria-live="polite">{data?.total ?? items.length} bookings · {page + 1} / {totalPages}</span>
          <button type="button" aria-label="Next page" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)} className="rounded border px-3 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

function BookingDetail({ appointmentId }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    AdminAPI.bookingDetail(appointmentId)
      .then(result => { if (!cancelled) setDetail(result); })
      .catch(err => { if (!cancelled) setError(requestError(err)); });
    return () => { cancelled = true; };
  }, [appointmentId]);
  if (error) return <p role="alert" className="text-sm text-red-700">{error}</p>;
  if (!detail) return <p className="text-sm text-gray-500">Loading booking…</p>;
  const rows = [
    ["Booked", formatAdminTime(detail.createdAt)],
    ["Service address", detail.serviceAddress],
    ["Price / travel fee", `${formatMoney(detail.price)} / ${formatMoney(detail.travelFee)}`],
    ["Platform fee / stylist share", `${formatMoney(detail.platformFee)} / ${formatMoney(detail.stylistShare)}`],
    ["Refunded", formatMoney(detail.refundedTotal)],
    ["Payment intent", detail.paymentIntentId],
    ["Stylist payout", detail.stripeTransferId || detail.payoutHoldReason || "Not paid out"],
    ["Dispute", detail.disputeStatus ? `${detail.disputeStatus}${detail.disputeReason ? `: ${detail.disputeReason}` : ""}` : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[max-content_1fr]">
      {rows.map(([label, value]) => <Fragment key={label}><dt className="text-gray-500">{label}</dt><dd className="break-all">{value}</dd></Fragment>)}
    </dl>
  );
}
