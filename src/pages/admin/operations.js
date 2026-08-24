import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { clearAuthToken, getAuthToken, showSuccessToastMessage } from "../../utils/constant";

const AdminNav = () => <div className="mb-6 flex flex-wrap gap-4 text-sm font-semibold"><Link to="/admin/categories" className="text-gray-500 hover:text-gray-800">Categories</Link><Link to="/admin/blog" className="text-gray-500 hover:text-gray-800">Blog</Link><Link to="/admin/stylers" className="text-gray-500 hover:text-gray-800">Stylists</Link><span className="text-brand underline">Operations</span></div>;

const Operations = () => {
  const [tab, setTab] = useState("overview");
  const [kpis, setKpis] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [kpiResponse, ticketResponse, reviewResponse, logResponse] = await Promise.all([
        APIService.adminKpis(), APIService.adminSupportTickets(), APIService.adminReviewQueue(), APIService.adminAuditLogs(),
      ]);
      setKpis(kpiResponse.data?.data || null);
      setTickets(ticketResponse.data?.data || []);
      setReviews(reviewResponse.data?.data || []);
      setLogs(logResponse.data?.data || []);
    } catch (error) {
      // APIService displays the error.
    } finally { setLoading(false); }
  };

  useEffect(() => { if (getAuthToken()) load(); else setLoading(false); }, []);

  const moderate = async (reviewId, action) => { await APIService.adminUpdateReviewModeration({ reviewId, action }); showSuccessToastMessage(`Review ${action.toLowerCase()}d`); load(); };
  const updateTicket = async (ticket) => { const status = window.prompt("Status: OPEN, IN_PROGRESS, RESOLVED, or CLOSED", ticket.status); if (!status) return; const adminResponse = window.prompt("Response to customer", ticket.adminResponse || ""); await APIService.adminUpdateSupportTicket({ ticketId: ticket.id, status, adminResponse }); showSuccessToastMessage("Ticket updated"); load(); };

  if (!getAuthToken()) return <Navigate to="/admin/login" replace />;
  const cards = kpis ? [["Customers", kpis.customers], ["Stylists", kpis.stylists], ["Approved stylists", kpis.approvedStylists], ["Appointments", kpis.appointments], ["Completed", kpis.completedAppointments], ["Open tickets", kpis.openSupportTickets], ["Reviews", kpis.reviews]] : [];

  return <div className="min-h-screen bg-[#f5f5f5] px-4 py-10"><div className="mx-auto max-w-5xl"><div className="mb-6 flex items-center justify-between"><p className="text-2xl font-bold text-gray-900">Admin operations</p><button type="button" onClick={() => { clearAuthToken(); window.location.href = "/admin/login"; }} className="text-sm font-semibold text-gray-500">Sign out</button></div><AdminNav />
    <div className="mb-5 flex flex-wrap gap-2">{[["overview", "Overview"], ["tickets", `Support (${tickets.length})`], ["reviews", `Reviews (${reviews.length})`], ["logs", "Audit log"]].map(([value, label]) => <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${tab === value ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600"}`}>{label}</button>)}</div>
    {loading ? <p className="text-sm text-gray-500">Loading operations...</p> : tab === "overview" ? <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value ?? 0}</p></div>)}</div> : tab === "tickets" ? <div className="grid gap-3">{tickets.length === 0 ? <p className="text-sm text-gray-500">No support tickets.</p> : tickets.map((ticket) => <div key={ticket.id} className="rounded-lg border bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{ticket.subject}</p><span className="text-xs font-bold text-gray-500">{ticket.status}</span></div><p className="mt-2 text-sm text-gray-600">{ticket.message}</p>{ticket.adminResponse && <p className="mt-2 text-sm text-brand">{ticket.adminResponse}</p>}<button type="button" onClick={() => updateTicket(ticket)} className="mt-3 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white">Update ticket</button></div>)}</div> : tab === "reviews" ? <div className="grid gap-3">{reviews.length === 0 ? <p className="text-sm text-gray-500">No reviews awaiting moderation.</p> : reviews.map((review) => <div key={review.id} className="rounded-lg border bg-white p-4"><p className="font-semibold">{review.ratingScore}/5 · {review.userName}</p><p className="mt-2 text-sm text-gray-600">{review.message}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => moderate(review.id, "APPROVED")} className="rounded-md bg-green-600 px-3 py-2 text-xs font-semibold text-white">Approve</button><button type="button" onClick={() => moderate(review.id, "REJECTED")} className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white">Reject</button></div></div>)}</div> : <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-gray-500"><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Resource</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id} className="border-b last:border-0"><td className="p-3 text-gray-500">{log.createdAt}</td><td className="p-3">{log.actorRole}</td><td className="p-3">{log.action}</td><td className="p-3">{log.resourceType} {log.resourceId}</td></tr>)}</tbody></table></div>}
  </div></div>;
};

export default Operations;
