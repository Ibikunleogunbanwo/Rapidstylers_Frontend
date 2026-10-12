import { useEffect, useState } from "react";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import { AdminPill } from "./adminShell";
import { formatAdminTime } from "./adminFormat";

/** Customer feedback sent from the website (newest first), which no admin screen showed before. */
const senderName = row => [row.userData?.firstname, row.userData?.lastname].filter(Boolean).join(" ");

export default function AdminFeedback() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const list = useAdminList(rows, row => [senderName(row), row.emailAddress, row.messageType, row.message].filter(Boolean).join(" "));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await AdminAPI.feedback();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setLoadError("Unable to load feedback.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (loading) return <p className="text-sm text-gray-500">Loading feedback…</p>;
  if (loadError) return <div role="alert">{loadError} <button type="button" onClick={load} className="underline">Retry</button></div>;
  return (
    <div>
      <AdminListControls list={list} label="Search feedback" />
      {rows.length === 0 ? <p className="text-sm text-gray-500">No feedback yet.</p>
        : list.filteredCount === 0 ? <AdminNoMatches list={list} noun="feedback entries" />
        : (
          <div className="grid gap-3">
            {list.visibleItems.map(row => (
              <div key={row.id} className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 break-words font-semibold">{senderName(row) || "Customer"} <span className="break-all font-normal text-gray-500">{row.emailAddress || row.userData?.emailAddress || ""}</span></p>
                  {row.messageType && <AdminPill>{row.messageType}</AdminPill>}
                </div>
                <p className="text-xs text-gray-400">{formatAdminTime(row.insertedDt)} · #{row.id}</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-700">{row.message}</p>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
