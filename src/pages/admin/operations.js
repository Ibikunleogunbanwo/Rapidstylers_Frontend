import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminInput, AdminTextarea, AdminPill, AdminStat } from "./adminShell";
import { getAuthToken, isAdminRole, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";
import AdminReviews from "./adminReviews";
import AdminFeedback from "./adminFeedback";
import { adminDay, adminZoneLabel, formatAdminTime } from "./adminFormat";
import { isAdminOwner, managerMayOpen } from "./adminRole";
import { OwnerAccessNeeded } from "./adminAccess";

const SECTIONS = [["overview", "Overview"], ["tickets", "Support"], ["reviews", "Reviews"], ["feedback", "Feedback"], ["logs", "Audit log"], ["business", "Business"], ["settings", "Settings"], ["payouts", "Payouts"]];
/** Sections that load and page themselves rather than through `load` below. */
const SELF_LOADING = ["reviews", "feedback"];
export const COMMISSION_MAX = 50;
const Operations = () => {
  const [params, setParams] = useSearchParams();
  const tab = SECTIONS.some(([key]) => key === params.get("section")) ? params.get("section") : "overview";
  // A manager sees the support, review and feedback work; the audit log,
  // business figures, settings and payout accounts are for owners.
  const owner = isAdminOwner();
  const sections = owner ? SECTIONS : SECTIONS.filter(([key]) => managerMayOpen(`/admin/operations?section=${key}`));
  const ownerOnlyTab = !sections.some(([key]) => key === tab);
  const setTab = value => { activeList.setSearch(""); setActionError(""); setTicketDraft(null); setParams({section:value}); };
  const [kpis, setKpis] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({ action: "", actor: "", day: "" });
  const [commission, setCommission] = useState("");
  const [savedCommission, setSavedCommission] = useState("");
  const [savingCommission, setSavingCommission] = useState(false);
  const [connectStatuses, setConnectStatuses] = useState([]);
  const [businessSummaries, setBusinessSummaries] = useState([]);
  const [loadingSections, setLoadingSections] = useState({});
  const completed = useRef(new Set());
  const activeReads = useRef(new Set());
  const actionLock = useRef(false);
  const [ticketDraft, setTicketDraft] = useState(null);
  const [readErrors, setReadErrors] = useState({});
  const [pendingAction, setPendingAction] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = async (section = tab) => {
    if (activeReads.current.has(section)) return;
    activeReads.current.add(section);
    setLoadingSections(previous => ({...previous, [section]:true}));
    setReadErrors(previous => ({...previous, [section]:""}));
    const requests = {
      overview: [() => APIService.adminKpis(), setKpis],
      tickets: [() => APIService.adminSupportTickets(), setTickets],
      logs: [() => APIService.adminAuditLogs(), setLogs],
      settings: [() => APIService.getCommissionSetting(), data => { setCommission(String(data.commissionPercent ?? "")); setSavedCommission(String(data.commissionPercent ?? "")); }],
      payouts: [() => APIService.adminStylerConnectStatuses(), setConnectStatuses],
      business: [() => APIService.adminStylerBusinessSummaries(), setBusinessSummaries],
    };
    try {
      const [request, update] = requests[section];
      const response = await request();
      const data = response.data?.data;
      if (["overview", "settings"].includes(section) ? !data || typeof data !== "object" || Array.isArray(data) : !Array.isArray(data)) throw new Error("Invalid section response");
      update(data);
    } catch { setReadErrors(previous => ({...previous, [section]:"Unable to load this section."})); }
    finally {
      completed.current.add(section);
      activeReads.current.delete(section);
      setLoadingSections(previous => ({...previous, [section]:false}));
    }
  };
  useEffect(() => { if (getAuthToken() && isAdminRole() && !ownerOnlyTab && !SELF_LOADING.includes(tab) && !completed.current.has(tab)) load(tab); }, [tab]);
  const loading = !SELF_LOADING.includes(tab) && (loadingSections[tab] || !completed.current.has(tab));
  const saveTicket = async event => {
    event.preventDefault();
    if (actionLock.current || !ticketDraft) return;
    actionLock.current = true;
    setPendingAction(true); setActionError("");
    try {
      await APIService.adminUpdateSupportTicket(ticketDraft);
      showSuccessToastMessage("Ticket updated");
      setTicketDraft(null);
      await load("tickets");
    } catch { setActionError("Unable to update ticket. Please try again."); }
    finally { actionLock.current = false; setPendingAction(false); }
  };
  const saveCommission = async () => {
    const value = Number(commission);
    if (!commission.trim() || !Number.isFinite(value) || value < 0 || value > COMMISSION_MAX) { setActionError(`Commission must be between 0 and ${COMMISSION_MAX}.`); return; }
    if (actionLock.current) return;
    if (savedCommission !== "" && Number(savedCommission) === value) return;
    if (!window.confirm(`Change commission from ${savedCommission === "" ? "the current rate" : `${Number(savedCommission)}%`} to ${value}%?`)) return;
    actionLock.current = true; setSavingCommission(true); setActionError("");
    try { await APIService.updateCommissionSetting(value); showSuccessToastMessage("Commission updated for new bookings"); await load("settings"); }
    catch { setActionError("Unable to save commission. Please try again."); }
    finally { actionLock.current = false; setSavingCommission(false); }
  };

  const logActions = [...new Set(logs.map(log => log.action).filter(Boolean))].sort();
  const filteredLogs = logs.filter(log => (!logFilters.action || log.action === logFilters.action)
    && (!logFilters.actor || [log.actorEmail, log.actorRole, log.actorId].filter(Boolean).join(" ").toLowerCase().includes(logFilters.actor.trim().toLowerCase()))
    && (!logFilters.day || adminDay(log.createdAt) === logFilters.day));
  const sectionLists = {tickets,logs:filteredLogs,business:businessSummaries,payouts:connectStatuses};
  const activeList = useAdminList(sectionLists[tab] || [], item=>JSON.stringify(item));
  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;
  if (ownerOnlyTab) return <OwnerAccessNeeded />;
  const sectionLabel = SECTIONS.find(([key]) => key === tab)?.[1];
  const cards = kpis ? [["Customers", kpis.customers], ["Stylists", kpis.stylists], ["Approved stylists", kpis.approvedStylists], ["Appointments", kpis.appointments], ["Completed", kpis.completedAppointments], ["Open tickets", kpis.openSupportTickets], ["Reviews", kpis.reviews]] : [];

  return <AdminPage eyebrow="Admin operations" title={tab === "overview" ? "Admin operations" : sectionLabel} pageTitle={tab === "overview" ? "Operations" : sectionLabel}>
    <div className="mb-5">
      <label htmlFor="operation-section" className="mb-1 block text-sm text-gray-600 md:hidden">Operations section</label>
      <select id="operation-section" value={tab} onChange={event => setTab(event.target.value)} className="w-full rounded border bg-white p-3 md:hidden">{sections.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
      <nav aria-label="Operations sections" className="hidden flex-wrap gap-2 md:flex">{sections.map(([value,label]) => <button key={value} type="button" aria-current={tab === value ? "page" : undefined} onClick={() => setTab(value)} className={`rounded-md border px-3 py-2 text-sm ${tab === value ? "border-brand text-brand bg-brand/5" : "border-black/10 bg-white text-gray-600"}`}>{label}</button>)}</nav>
    </div>
    {ticketDraft && <form onSubmit={saveTicket} className="mb-5 rounded-lg border bg-white p-4">
      <h2 className="mb-3 font-semibold">Update support ticket</h2>
      <label htmlFor="ticket-status" className="mb-1 block text-sm">Ticket status</label>
      <select id="ticket-status" value={ticketDraft.status} disabled={pendingAction} onChange={event => setTicketDraft({...ticketDraft,status:event.target.value})} className="mb-3 w-full rounded border p-2">{["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(status=><option key={status}>{status}</option>)}</select>
      <label htmlFor="ticket-response" className="mb-1 block text-sm">Response to customer</label>
      <AdminTextarea id="ticket-response" value={ticketDraft.adminResponse} disabled={pendingAction} onChange={event=>setTicketDraft({...ticketDraft,adminResponse:event.target.value})}/>
      <div className="mt-3 flex gap-3"><button type="submit" disabled={pendingAction} className="rounded bg-brand px-4 py-2 text-sm text-white">{pendingAction ? "Saving ticket…" : "Save ticket"}</button><button type="button" disabled={pendingAction} onClick={()=>setTicketDraft(null)}>Cancel</button></div>
    </form>}
    {!loading && !readErrors[tab] && sectionLists[tab] && <AdminListControls key={tab} list={activeList} label="Search this section" />}
    {actionError && <p role="alert">{actionError}</p>}
    {loading ? <p className="text-sm text-gray-500">Loading operations…</p> : readErrors[tab] ? <div role="alert">{readErrors[tab]} <button type="button" onClick={() => load(tab)}>Retry</button></div> : tab === "overview" ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(([label, value]) => <AdminStat key={label} label={label} value={value} />)}</div> : tab === "tickets" ? <div className="grid gap-3">{tickets.length === 0 ? <p className="text-sm text-gray-500">No support tickets.</p> : activeList.filteredCount === 0 ? <AdminNoMatches list={activeList} noun="tickets" /> : activeList.visibleItems.map((ticket) => <div key={ticket.id} className="rounded-lg border bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words font-semibold">{ticket.subject}</p><span className="text-xs font-bold text-gray-500">{ticket.status}</span></div><p className="mt-1 break-words text-xs text-gray-500">#{ticket.ticketId ?? ticket.id} · {ticket.senderName || "Unknown sender"}{ticket.senderEmail ? ` <${ticket.senderEmail}>` : ""}{ticket.senderRole ? ` · ${ticket.senderRole === "STYLIST" ? "Stylist" : "Customer"}` : ""} · {formatAdminTime(ticket.createdAt)}</p><p className="mt-2 break-words text-sm text-gray-600">{ticket.message}</p>{ticket.adminResponse && <p className="mt-2 text-sm text-brand">{ticket.adminResponse}</p>}<button type="button" disabled={pendingAction} onClick={() => {setActionError("");setTicketDraft({ticketId:ticket.id,status:ticket.status,adminResponse:ticket.adminResponse || ""});}} className="mt-3 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Update ticket</button></div>)}</div> : tab === "reviews" ? <AdminReviews /> : tab === "feedback" ? <AdminFeedback /> : tab === "settings" ? <CommissionSetting value={commission} saved={savedCommission} onChange={setCommission} onSave={saveCommission} saving={savingCommission} /> : ["business", "payouts"].includes(tab) && activeList.search.trim() && activeList.filteredCount === 0 ? <AdminNoMatches list={activeList} noun="stylists" /> : tab === "business" ? <BusinessStatsTable rows={activeList.visibleItems} /> : tab === "payouts" ? <ConnectStatusTable rows={activeList.visibleItems} /> : <AuditLogTable rows={activeList.visibleItems} actions={logActions} filters={logFilters} onFilters={value => { setLogFilters(value); activeList.setPage(1); }} total={logs.length} />}
  </AdminPage>;
};

/** Connect states as the shell's tones, so the same state reads the same here as
 *  it does on the payments page. */
const CONNECT_TONES = {
  COMPLETE: "positive",
  PENDING: "attention",
  REJECTED: "negative",
  NOT_STARTED: "neutral",
};

const humanizeConnectReason = (reason) => {
  if (!reason) return null;
  const cleaned = String(reason).replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

/** Admin support view: every stylist's Connect payout status, problems first. */
const ConnectStatusTable = ({ rows }) => {
  if (!rows || rows.length === 0) return <p className="text-sm text-gray-500">No stylists yet.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-gray-500">
            <th className="p-3">Stylist</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Verification</th>
            <th className="p-3">Payout status</th>
            <th className="p-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stylerId} className="border-b align-top last:border-0">
              <td className="p-3">
                <p className="font-semibold">{row.businessName || row.name || row.stylerId}</p>
                <p className="text-xs text-gray-400">{row.stylerId}</p>
              </td>
              <td className="p-3 text-gray-600">{row.emailAddress}</td>
              <td className="p-3">
                <AdminPill tone={row.verificationStatus === "APPROVED" ? "positive" : "neutral"}>
                  {row.verificationStatus}
                </AdminPill>
              </td>
              <td className="p-3">
                <AdminPill tone={CONNECT_TONES[row.connectStatus] || CONNECT_TONES.NOT_STARTED}>
                  {String(row.connectStatus || "NOT_STARTED").replace(/_/g, " ")}
                </AdminPill>
              </td>
              <td className="p-3 text-xs text-gray-600">{humanizeConnectReason(row.disabledReason) || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const formatMoney = (value) => {
  const num = Number(value || 0);
  return "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/** Admin view: per-stylist business stats, most appointments first. */
const BusinessStatsTable = ({ rows }) => {
  if (!rows || rows.length === 0) return <p className="text-sm text-gray-500">No stylists yet.</p>;
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs text-gray-500">
            <th className="p-3">Stylist</th>
            <th className="p-3">Verification</th>
            <th className="p-3">Appointments</th>
            <th className="p-3">Clients</th>
            <th className="p-3">Pending</th>
            <th className="p-3">Finished</th>
            <th className="p-3">Gross revenue</th>
            <th className="p-3">Commission</th>
            <th className="p-3">Net revenue</th>
            <th className="p-3">Popular services</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stylerId} className="border-b align-top last:border-0">
              <td className="p-3">
                <p className="font-semibold">{row.businessName || row.name || row.stylerId}</p>
                <p className="text-xs text-gray-400">{row.stylerId}</p>
              </td>
              <td className="p-3">
                <AdminPill tone={row.verificationStatus === "APPROVED" ? "positive" : "neutral"}>
                  {row.verificationStatus}
                </AdminPill>
              </td>
              <td className="p-3">{Number(row.totalAppointments || 0).toLocaleString()}</td>
              <td className="p-3">{Number(row.clients || 0).toLocaleString()}</td>
              <td className="p-3">{Number(row.pending || 0).toLocaleString()}</td>
              <td className="p-3">{Number(row.finished || 0).toLocaleString()}</td>
              <td className="p-3">{formatMoney(row.totalRevenue)}</td>
              <td className="p-3">{formatMoney(row.totalCommission)}</td>
              <td className="p-3 font-semibold">{formatMoney(row.netRevenue)}</td>
              <td className="p-3 max-w-[220px]">
                {(row.popularServices || []).length === 0 ? (
                  <span className="text-xs text-gray-400">-</span>
                ) : (
                  <ul className="text-xs text-gray-600 space-y-0.5">
                    {(row.popularServices || []).slice(0, 3).map((service, index) => (
                      <li key={index} className="flex justify-between gap-2">
                        <span className="truncate">{service.name}</span>
                        <span className="font-semibold shrink-0">{service.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** The latest audit entries with filters by action, actor and day (in the business time zone). */
const AuditLogTable = ({ rows, actions, filters, onFilters, total }) => (
  <div className="grid gap-3">
    <div className="grid gap-3 rounded-lg border bg-white p-3 sm:grid-cols-3">
      <label className="grid gap-1 text-xs text-gray-500">Action
        <select value={filters.action} onChange={e => onFilters({ ...filters, action: e.target.value })} className="rounded border bg-white p-2 text-sm text-gray-900">
          <option value="">All actions</option>
          {actions.map(action => <option key={action} value={action}>{action}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-gray-500">Actor (email or role)
        <AdminInput type="search" value={filters.actor} onChange={e => onFilters({ ...filters, actor: e.target.value })} />
      </label>
      <label className="grid gap-1 text-xs text-gray-500">Day
        <AdminInput type="date" value={filters.day} onChange={e => onFilters({ ...filters, day: e.target.value })} />
      </label>
    </div>
    <p className="text-xs text-gray-500">Showing the latest {total} entries. Times are {adminZoneLabel()}.</p>
    {rows.length === 0 ? <p className="text-sm text-gray-500">No audit entries match these filters.</p> : (
      <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Resource</th></tr></thead><tbody>{rows.map((log) => <tr key={log.id} className="border-b align-top last:border-0"><td className="whitespace-nowrap p-3 text-gray-500">{formatAdminTime(log.createdAt)}</td><td className="p-3">{log.actorEmail || log.actorRole}{log.actorEmail && log.actorRole ? <span className="block text-xs text-gray-400">{log.actorRole}</span> : null}</td><td className="p-3">{log.action}</td><td className="p-3">{log.resourceType} {log.resourceId}</td></tr>)}</tbody></table></div>
    )}
  </div>
);

const CommissionSetting = ({ value, saved, onChange, onSave, saving }) => (
  <div className="rounded-lg border bg-white p-4">
    <p className="font-semibold">Platform commission</p>
    <p className="mt-1 text-sm text-gray-600">
      Commission charged on new bookings, from 0 to {COMMISSION_MAX}%. Existing bookings keep their original rate. Changes are recorded in the audit log.
    </p>
    {saved !== "" && <p className="mt-1 text-sm text-gray-600">Current rate: {Number(saved)}%</p>}
    <div className="mt-3 flex items-end gap-3 max-w-sm">
      <div className="flex-1">
        <label htmlFor="commission-percent" className="block mb-1 text-xs text-gray-500">Commission %</label>
        <AdminInput
          id="commission-percent"
          type="number"
          min="0"
          max={COMMISSION_MAX}
          step="0.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || (saved !== "" && value.trim() !== "" && Number(value) === Number(saved))}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  </div>
);

export default Operations;
