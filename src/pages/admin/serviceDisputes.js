import { useEffect, useRef, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { useAdminList, AdminListControls } from "./adminList";

// Columns of the dispute queue, in display order. Every value is a string the
// backend returns (or null), so a row is validated against this list before it
// is trusted.
const COLUMNS = [
  ["appointmentId", "Appointment"],
  ["userId", "Customer"],
  ["stylerId", "Stylist"],
  ["appointmentDate", "Date"],
  ["arrivalTime", "Arrival"],
  ["completedAt", "Completed"],
  ["disputedAt", "Disputed"],
  ["reason", "Reason"],
  ["paymentStatus", "Payment status"],
];

const NOTE_LIMIT = 1000;

// The admin queue of completed appointments whose customer says they did not
// happen. Their stylist payout is held until an admin resolves the dispute.
// Loads only while its tab is active, and takes `refundPending` so a refund
// started from here blocks a second financial action.
export default function ServiceDisputes({ active, onRefund, refundPending }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const loaded = useRef(false);
  const list = useAdminList(rows, (row) => JSON.stringify(row));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await APIService.adminServiceDisputes();
      const data = response.data?.data;
      const malformed =
        response.data?.statusCode !== "200" ||
        !Array.isArray(data) ||
        data.some(
          (row) =>
            !row ||
            typeof row !== "object" ||
            typeof row.appointmentId !== "string" ||
            !row.appointmentId.trim() ||
            COLUMNS.some(([key]) => row[key] != null && typeof row[key] !== "string"),
        );
      if (malformed) throw new Error("Invalid response");
      setRows(data);
    } catch {
      setLoadError("Unable to load service disputes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active && !loaded.current) {
      loaded.current = true;
      load();
    }
  }, [active]);

  const resolve = async () => {
    if (pending.current || refundPending.current || !selected || !acknowledged) return;
    if (note.length > NOTE_LIMIT) {
      setError("Keep the resolution note under 1000 characters.");
      return;
    }
    pending.current = true;
    refundPending.current = true;
    setSaving(true);
    setError("");
    try {
      const response = await APIService.adminResolveServiceDispute({
        appointmentId: selected,
        note: note.trim(),
      });
      if (response.data?.statusCode !== "200") {
        setError(response.data?.message || "Unable to resolve dispute.");
        return;
      }
      setSelected(null);
      setNote("");
      setAcknowledged(false);
      await load();
    } catch {
      setError("Unable to resolve dispute. Verify its status before retrying.");
    } finally {
      pending.current = false;
      refundPending.current = false;
      setSaving(false);
    }
  };

  if (!active) return null;

  const startResolve = (appointmentId) => {
    setSelected(appointmentId);
    setNote("");
    setAcknowledged(false);
    setError("");
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">Service disputes</h2>
      <p className="mt-1 mb-4 text-sm text-gray-600">
        Refund the customer first if money is owed, then resolve the dispute.
        Resolution may release the remaining stylist share.
      </p>
      {loading ? (
        <p>Loading service disputes...</p>
      ) : loadError ? (
        <div role="alert">
          {loadError}{" "}
          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <AdminListControls list={list} label="Search disputes" />
          {rows.length === 0 ? (
            <p>No service disputes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    {COLUMNS.map(([key, label]) => (
                      <th className="p-3" key={key}>
                        {label}
                      </th>
                    ))}
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.visibleItems.map((row) => (
                    <tr className="border-t align-top" key={row.appointmentId}>
                      {COLUMNS.map(([key]) => (
                        <td className="p-3" key={key}>
                          {row[key] || "-"}
                        </td>
                      ))}
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={saving || refundPending.current}
                          onClick={() => onRefund(row)}
                          className="rounded border px-3 py-2"
                        >
                          Refund customer
                        </button>
                        <button
                          type="button"
                          disabled={saving || refundPending.current}
                          onClick={() => startResolve(row.appointmentId)}
                          className="mt-2 rounded border px-3 py-2"
                        >
                          Resolve dispute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {selected && (
        <section aria-label="Resolve service dispute" className="mt-4 rounded border p-4">
          <h3 className="font-semibold">Resolve {selected}</h3>
          <p className="my-2 text-sm">
            Confirm any refund owed has been completed before resolving. This
            may release the remaining stylist share.
          </p>
          <label htmlFor="dispute-resolution-note">Resolution note</label>
          <textarea
            id="dispute-resolution-note"
            aria-describedby="dispute-resolution-note-count"
            value={note}
            disabled={saving}
            maxLength={NOTE_LIMIT}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 block w-full rounded border p-2"
          />
          <p id="dispute-resolution-note-count" className="mt-1 text-xs text-gray-500">
            {note.length}/{NOTE_LIMIT} characters.
          </p>
          <label className="my-3 flex items-center gap-2">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={saving}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            Any refund owed to the customer has been completed
          </label>
          {error && (
            <p role="alert" className="mb-3 text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={saving || !acknowledged || note.length > NOTE_LIMIT || refundPending.current}
            onClick={resolve}
            className="rounded bg-brand px-3 py-2 text-white"
          >
            {saving ? "Resolving..." : "Confirm resolve"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setSelected(null);
              setError("");
            }}
            className="ml-2 rounded border px-3 py-2"
          >
            Cancel
          </button>
        </section>
      )}
    </div>
  );
}
