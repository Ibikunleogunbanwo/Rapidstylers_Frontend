import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { clearAllSessionTokens, getAuthToken, isAdminRole } from "../../utils/constant";

const AdminNav = () => (
  <div className="mb-6 flex flex-wrap gap-4 text-sm font-semibold">
    <Link to="/admin/categories" className="text-gray-500 hover:text-gray-800">Categories</Link>
    <Link to="/admin/blog" className="text-gray-500 hover:text-gray-800">Blog</Link>
    <Link to="/admin/stylers" className="text-gray-500 hover:text-gray-800">Stylists</Link>
    <Link to="/admin/operations" className="text-gray-500 hover:text-gray-800">Operations</Link>
    <Link to="/admin/payments" className="text-gray-500 hover:text-gray-800">Payments</Link>
    <span className="text-brand underline">Recovery</span>
  </div>
);

const STAGE_STYLES = {
  0: "bg-gray-100 text-gray-600",
  1: "bg-blue-100 text-blue-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-orange-100 text-orange-700",
  4: "bg-red-100 text-red-700",
};

const Recovery = () => {
  document.title = "Recovery Campaigns | RapidStylers";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    APIService.adminRecoveryCampaigns()
      .then((res) => setRows(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (getAuthToken() && isAdminRole()) load();
    else setLoading(false);
  }, []);

  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;

  const byStage = rows.reduce((acc, row) => {
    acc[row.stage] = (acc[row.stage] || 0) + 1;
    return acc;
  }, {});
  const total = rows.length;
  const converted = rows.filter((r) => r.converted).length;

  return (
    <div className="min-h-screen bg-[#f5f5f5] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-2xl font-bold text-gray-900">Recovery campaigns</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => { clearAllSessionTokens(); window.location.href = "/admin/login"; }}
              className="text-sm font-semibold text-gray-500"
            >
              Sign out
            </button>
          </div>
        </div>
        <AdminNav />
        <p className="mb-5 text-sm text-gray-500">
          Customers who started a sign-up but never created an account, and which recovery email they received
          (24h reminder → 7-day → 14-day → 1-month). Uses a "created" account after the follow-up stops.
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          <div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">Abandoned</p><p className="mt-1 text-2xl font-bold text-gray-900">{total}</p></div>
          <div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">24h reminder</p><p className="mt-1 text-2xl font-bold text-blue-600">{byStage[1] || 0}</p></div>
          <div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">7-day</p><p className="mt-1 text-2xl font-bold text-amber-600">{byStage[2] || 0}</p></div>
          <div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">14-day</p><p className="mt-1 text-2xl font-bold text-orange-600">{byStage[3] || 0}</p></div>
          <div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">1-month final</p><p className="mt-1 text-2xl font-bold text-red-600">{byStage[4] || 0}</p></div>
          <div className="rounded-lg border bg-white p-4"><p className="text-xs text-gray-500">Converted</p><p className="mt-1 text-2xl font-bold text-green-600">{converted}</p></div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading recovery campaigns...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No abandoned sign-ups yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500">
                  <th className="p-3">Email</th>
                  <th className="p-3">Started</th>
                  <th className="p-3">Stage</th>
                  <th className="p-3">Last email sent</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const stage = Number(row.stage) || 0;
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-3 font-medium text-gray-900">{row.email}</td>
                      <td className="p-3 text-gray-600">{row.attemptedAt || "—"}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STAGE_STYLES[stage]}`}>
                          {row.stageLabel || `Stage ${stage}`}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{row.lastSentAt || "—"}</td>
                      <td className="p-3">
                        {row.converted ? (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">Converted</span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recovery;