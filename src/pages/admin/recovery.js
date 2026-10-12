import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminPill, AdminStat } from "./adminShell";
import { getAuthToken, isAdminRole } from "../../utils/constant";

/**
 * A campaign's stage as a tone, read left to right as a rising escalation: the
 * reminder is neutral, the middle follow-ups ask for attention, and the final one
 * is the last attempt. The tones come from the shell rather than being five
 * hand-picked colour pairs here, which is how this page used to read differently
 * from the two other pages showing the same kind of state.
 */
const STAGE_TONES = { 0: "neutral", 1: "neutral", 2: "attention", 3: "attention", 4: "negative" };

const Recovery = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const pending = useRef(false);
  const load = () => {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setLoadError("");
    APIService.adminRecoveryCampaigns()
      .then((res) => {
        if (!Array.isArray(res.data?.data) || (res.data?.statusCode && String(res.data.statusCode) !== "200")) throw new Error("Invalid recovery response");
        setRows(res.data.data);
      })
      .catch(() => setLoadError("Unable to load recovery campaigns."))
      .finally(() => { pending.current = false; setLoading(false); });
  };

  useEffect(() => {
    if (getAuthToken() && isAdminRole()) load();
    else setLoading(false);
  }, []);

  const campaignList = useAdminList(rows, row => JSON.stringify(row));

  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;

  const byStage = rows.reduce((acc, row) => {
    acc[row.stage] = (acc[row.stage] || 0) + 1;
    return acc;
  }, {});
  const total = rows.length;
  const converted = rows.filter((r) => r.converted).length;

  return (
    <AdminPage
      eyebrow="Admin"
      title="Recovery campaigns"
      actions={
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600"
        >
          Refresh
        </button>
      }
    >
        <p className="mb-5 text-sm text-gray-500">
          Customers who started a sign-up but never created an account, and which recovery email they received
          (24h reminder, then 7-day, 14-day, 1-month). Follow-ups stop when an account is created. Counts reflect all campaigns returned by the service.
        </p>

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
          <AdminStat label="Abandoned" value={loading ? "Loading…" : loadError ? "Unavailable" : total} />
          <AdminStat label="24h reminder" value={loading ? "Loading…" : loadError ? "Unavailable" : byStage[1] || 0} />
          <AdminStat label="7-day" value={loading ? "Loading…" : loadError ? "Unavailable" : byStage[2] || 0} />
          <AdminStat label="14-day" value={loading ? "Loading…" : loadError ? "Unavailable" : byStage[3] || 0} />
          <AdminStat label="1-month final" value={loading ? "Loading…" : loadError ? "Unavailable" : byStage[4] || 0} />
          <AdminStat label="Converted" value={loading ? "Loading…" : loadError ? "Unavailable" : converted} />
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading recovery campaigns…</p>
        ) : loadError ? (
            <div role="alert">{loadError} <button type="button" onClick={load}>Retry</button></div>
          ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No abandoned sign-ups yet.</p>
        ) : (
          <div className="rounded-lg border bg-white p-4">
            <AdminListControls list={campaignList} label="Search campaigns" />
            {campaignList.filteredCount === 0 && <AdminNoMatches list={campaignList} noun="campaigns" />}
            <div className="overflow-x-auto">
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
                {campaignList.visibleItems.map((row, idx) => {
                  const stage = Number(row.stage) || 0;
                  return (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="p-3 font-medium text-gray-900">{row.email}</td>
                      <td className="p-3 text-gray-600">{row.attemptedAt || "-"}</td>
                      <td className="p-3">
                        <AdminPill tone={STAGE_TONES[stage] || "neutral"}>
                          {row.stageLabel || `Stage ${stage}`}
                        </AdminPill>
                      </td>
                      <td className="p-3 text-gray-600">{row.lastSentAt || "-"}</td>
                      <td className="p-3">
                        {row.converted ? (
                          <AdminPill tone="positive">Converted</AdminPill>
                        ) : (
                          <AdminPill>Pending</AdminPill>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
    </AdminPage>
  );
};

export default Recovery;