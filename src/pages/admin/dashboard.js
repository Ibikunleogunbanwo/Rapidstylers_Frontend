import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, isAdminRole } from "../../utils/constant";
import { AdminPage, AdminCard, AdminStat } from "./adminShell";

const READS = [
  ["kpis", () => APIService.adminKpis()],
  ["stylists", () => APIService.getStylerVerificationQueue()],
  ["reviews", () => APIService.adminReviewQueue()],
  ["disputes", () => APIService.adminServiceDisputes()],
  ["payouts", () => APIService.adminUnpaidPayouts()],
];
const count = value => Number.isFinite(value) && value >= 0 ? value.toLocaleString() : "Unavailable";

export default function AdminDashboard() {
  const authorized = Boolean(getAuthToken() && isAdminRole());
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    if (!authorized) return;
    document.title = "Admin dashboard | RapidStylers";
    let cancelled = false;
    setState({});
    READS.forEach(async ([key, read]) => {
      try {
        const response = await read();
        const data = response.data?.data;
        if (String(response.data?.statusCode) !== "200" || (key === "kpis" ? !data || typeof data !== "object" || Array.isArray(data) : !Array.isArray(data))) throw new Error("Invalid response");
        if (!cancelled) setState(previous => ({...previous, [key]:{data}}));
      } catch {
        if (!cancelled) setState(previous => ({...previous, [key]:{error:true}}));
      }
    });
    return () => { cancelled = true; };
  }, [revision, authorized]);
  if (!authorized) return <Navigate to="/admin/login" replace />;
  const kpis = state.kpis?.data;
  const queueValue = (key, filter) => !state[key] ? "Loading…" : state[key].error ? "Unavailable" : count(filter ? state[key].data.filter(filter).length : state[key].data.length);
  const needsAttention = [
    ["Professional applications", "/admin/stylers", queueValue("stylists", row => row.verificationStatus === "PENDING")],
    ["Reviews awaiting moderation", "/admin/operations?section=reviews", queueValue("reviews")],
    ["Service disputes", "/admin/payments?section=disputes", queueValue("disputes")],
    ["Unpaid payouts", "/admin/payments?section=unpaidPayouts", queueValue("payouts")],
    ["Open support tickets", "/admin/operations?section=tickets", !state.kpis ? "Loading…" : count(kpis?.openSupportTickets)],
  ];
  return <AdminPage eyebrow="Admin" title="Dashboard" actions={<button type="button" onClick={() => setRevision(value => value + 1)} className="rounded-md border bg-white px-3 py-2 text-sm">Refresh</button>}>
    <p className="mb-6 text-sm text-gray-600">Marketplace totals and queues that need your attention. Totals cover all time.</p>
    {Object.values(state).some(result => result.error) && <p role="alert" className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">Some dashboard data could not be loaded. Refresh to retry. Unavailable counts are not zero.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Customers", "customers"], ["Professionals", "stylists"], ["Approved professionals", "approvedStylists"], ["Appointments", "appointments"], ["Pending appointments", "pendingAppointments"], ["Completed appointments", "completedAppointments"]].map(([label, key]) => <AdminStat key={key} label={label} value={!state.kpis ? "Loading…" : count(kpis?.[key])} />)}
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <AdminCard><h2 className="text-lg font-medium">Needs attention</h2><p className="mt-1 text-sm text-gray-500">Open a queue to review and take action.</p><ul className="mt-4 divide-y">{needsAttention.map(([label, to, value]) => <li key={label}><Link to={to} aria-label={`${label} ${value}`} className="flex items-center justify-between gap-4 py-3 text-sm hover:text-brand"><span>{label}</span><span className="font-semibold">{value}</span></Link></li>)}</ul></AdminCard>
      <AdminCard><h2 className="text-lg font-medium">Marketplace tools</h2><div className="mt-4 grid gap-3">
        <Link to="/admin/operations?section=business" className="rounded-md border p-3 text-sm hover:border-brand">Professional business summaries</Link>
        <Link to="/admin/stylers?section=images" className="rounded-md border p-3 text-sm hover:border-brand">Review portfolio gallery</Link>
        <Link to="/admin/operations?section=logs" className="rounded-md border p-3 text-sm hover:border-brand">View audit log</Link>
        <Link to="/admin/announcements" className="rounded-md border p-3 text-sm hover:border-brand">Send an announcement</Link>
      </div></AdminCard>
    </div>
  </AdminPage>;
}
