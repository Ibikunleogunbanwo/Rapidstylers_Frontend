import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { clearAuthToken, clearAdminRole, getAuthToken, isAdminRole, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";

const AdminNav = () => <div className="mb-6 flex flex-wrap gap-4 text-sm font-semibold"><Link to="/admin/categories" className="text-gray-500 hover:text-gray-800">Categories</Link><Link to="/admin/blog" className="text-gray-500 hover:text-gray-800">Blog</Link><Link to="/admin/stylers" className="text-gray-500 hover:text-gray-800">Stylists</Link><Link to="/admin/payments" className="text-gray-500 hover:text-gray-800">Payments</Link><Link to="/admin/recovery" className="text-gray-500 hover:text-gray-800">Recovery</Link><span className="text-brand underline">Operations</span></div>;

const Operations = () => {
  const [tab, setTab] = useState("overview");
  const [kpis, setKpis] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);
  const [commission, setCommission] = useState("");
  const [savingCommission, setSavingCommission] = useState(false);
  const [connectStatuses, setConnectStatuses] = useState([]);
  const [businessSummaries, setBusinessSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [kpiResponse, ticketResponse, reviewResponse, logResponse, commissionResponse, connectResponse, businessResponse] = await Promise.all([
        APIService.adminKpis(), APIService.adminSupportTickets(), APIService.adminReviewQueue(), APIService.adminAuditLogs(), APIService.getCommissionSetting(), APIService.adminStylerConnectStatuses(), APIService.adminStylerBusinessSummaries(),
      ]);
      setKpis(kpiResponse.data?.data || null);
      setTickets(ticketResponse.data?.data || []);
      setReviews(reviewResponse.data?.data || []);
      setLogs(logResponse.data?.data || []);
      setCommission(commissionResponse.data?.data?.commissionPercent ?? "");
      setConnectStatuses(connectResponse.data?.data || []);
      setBusinessSummaries(businessResponse.data?.data || []);
    } catch (error) {
      // APIService displays the error.
    } finally { setLoading(false); }
  };

  useEffect(() => { if (getAuthToken() && isAdminRole()) load(); else setLoading(false); }, []);

  const moderate = async (reviewId, action) => { await APIService.adminUpdateReviewModeration({ reviewId, action }); showSuccessToastMessage(`Review ${action.toLowerCase()}d`); load(); };
  const updateTicket = async (ticket) => { const status = window.prompt("Status: OPEN, IN_PROGRESS, RESOLVED, or CLOSED", ticket.status); if (!status) return; const adminResponse = window.prompt("Response to customer", ticket.adminResponse || ""); await APIService.adminUpdateSupportTicket({ ticketId: ticket.id, status, adminResponse }); showSuccessToastMessage("Ticket updated"); load(); };
  const saveCommission = async () => { const value = parseFloat(commission); if (Number.isNaN(value) || value < 0 || value > 100) { showErrorToastMessage("Commission must be between 0 and 100"); return; } setSavingCommission(true); try { await APIService.updateCommissionSetting(value); showSuccessToastMessage("Commission updated — applies to new bookings"); load(); } catch (error) { /* APIService displays the error. */ } finally { setSavingCommission(false); } };

  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;
  const cards = kpis ? [["Customers", kpis.customers], ["Stylists", kpis.stylists], ["Approved stylists", kpis.approvedStylists], ["Appointments", kpis.appointments], ["Completed", kpis.completedAppointments], ["Open tickets", kpis.openSupportTickets], ["Reviews", kpis.reviews]] : [];
  const connectProblems = connectStatuses.filter((r) => r.connectStatus === "REJECTED").length;

  return <div className="min-h-screen bg-[#f5f5f5] px-4 py-10"><div className="mx-auto max-w-5xl">    <div className="mb-6 flex items-center justify-between"><p className="text-2xl font-bold text-gray-900">Admin operations</p><button type="button" onClick={() => { clearAuthToken(); clearAdminRole(); window.location.href = "/admin/login"; }} className="text-sm font-semibold text-gray-500">Sign out</button></div><AdminNav />
    <div className="mb-5 flex flex-wrap gap-2">{[["overview", "Overview"], ["tickets", `Support (${tickets.length})`], ["reviews", `Reviews (${reviews.length})`], ["logs", "Audit log"], ["business", `Business (${businessSummaries.length})`], ["settings", "Settings"], ["payouts", connectProblems > 0 ? `Payouts (${connectProblems} need attention)` : "Payouts"]].map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${tab === value ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600"}`}>{label}</button>)}</div>
    {loading ? <p className="text-sm text-gray-500">Loading operations...</p> : tab === "overview" ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value ?? 0}</p></div>)}</div> : tab === "tickets" ? <div className="grid gap-3">{tickets.length === 0 ? <p className="text-sm text-gray-500">No support tickets.</p> : tickets.map((ticket) => <div key={ticket.id} className="rounded-lg border bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{ticket.subject}</p><span className="text-xs font-bold text-gray-500">{ticket.status}</span></div><p className="mt-2 text-sm text-gray-600">{ticket.message}</p>{ticket.adminResponse && <p className="mt-2 text-sm text-brand">{ticket.adminResponse}</p>}<button type="button" onClick={() => updateTicket(ticket)} className="mt-3 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Update ticket</button></div>)}</div> : tab === "reviews" ? <div className="grid gap-3">{reviews.length === 0 ? <p className="text-sm text-gray-500">No reviews awaiting moderation.</p> : reviews.map((review) => <div key={review.id} className="rounded-lg border bg-white p-4"><p className="font-semibold">{review.ratingScore}/5 · {review.userName}</p><p className="mt-2 text-sm text-gray-600">{review.message}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => moderate(review.id, "APPROVED")} className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white">Approve</button><button type="button" onClick={() => moderate(review.id, "REJECTED")} className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white">Reject</button></div></div>)}</div> : tab === "settings" ? <CommissionSetting value={commission} onChange={setCommission} onSave={saveCommission} saving={savingCommission} /> : tab === "business" ? <BusinessStatsTable rows={businessSummaries} /> : tab === "payouts" ? <ConnectStatusTable rows={connectStatuses} /> : <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Resource</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-b last:border-0"><td className="p-3 text-gray-500">{log.createdAt}</td><td className="p-3">{log.actorRole}</td><td className="p-3">{log.action}</td><td className="p-3">{log.resourceType} {log.resourceId}</td></tr>)}</tbody></table></div>}
  </div></div>;
};

const CONNECT_BADGES = {
  COMPLETE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
  NOT_STARTED: "bg-gray-100 text-gray-600",
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
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.verificationStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {row.verificationStatus}
                </span>
              </td>
              <td className="p-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${CONNECT_BADGES[row.connectStatus] || CONNECT_BADGES.NOT_STARTED}`}>
                  {String(row.connectStatus || "NOT_STARTED").replace(/_/g, " ")}
                </span>
              </td>
              <td className="p-3 text-xs text-gray-600">{humanizeConnectReason(row.disabledReason) || "—"}</td>
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
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.verificationStatus === "APPROVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {row.verificationStatus}
                </span>
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
                  <span className="text-xs text-gray-400">—</span>
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

const CommissionSetting = ({ value, onChange, onSave, saving }) => (
  <div className="rounded-lg border bg-white p-4">
    <p className="font-semibold">Platform commission</p>
    <p className="mt-1 text-sm text-gray-600">
      Percentage taken from each completed appointment. Applies to new bookings and the stylist payout summary — no restart needed.
    </p>
    <div className="mt-3 flex items-end gap-3 max-w-sm">
      <div className="flex-1">
        <label className="block mb-1 text-xs text-gray-500">Commission %</label>
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  </div>
);

export default Operations;
