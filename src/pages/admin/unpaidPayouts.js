import { useEffect, useRef, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { useAdminList, AdminListControls, AdminNoMatches } from "./adminList";
import { AdminPill } from "./adminShell";

// Columns of the unpaid-payout queue, in display order. Every value is a string
// the backend returns (or null), so a row is validated against this list before
// it is trusted. `canReceivePayouts` is a separate boolean and is checked apart.
const COLUMNS = [
  ["appointmentId", "Appointment"],
  ["businessName", "Business"],
  ["stylerId", "Stylist"],
  ["completedAt", "Completed"],
  ["stylistShare", "Stylist share"],
  ["reason", "Hold reason"],
  ["connectStatus", "Connect status"],
];

// The hold reasons the backend sends, in the words an admin reads rather than
// the codes the service uses.
const REASON_LABELS = {
  NO_PAYOUT_ACCOUNT: "No payout account yet",
  NOT_SCHEDULED: "Payout not scheduled",
};

const connectTone = (status) =>
  status === "COMPLETE" ? "positive"
    : status === "REJECTED" ? "negative"
      : status === "PENDING" ? "attention"
        : "neutral";

// The admin queue of completed, charged bookings whose stylist has not been paid
// and whose payout is not already scheduled: held because the stylist has no
// payout account, or older bookings from before payouts waited. Open disputes
// are listed on the Disputes tab instead. Loads only while its tab is active,
// and takes `refundPending` so sending a payout blocks a second financial
// action from the refund form.
export default function UnpaidPayouts({ active, refundPending }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const loaded = useRef(false);
  const list = useAdminList(rows, (row) => JSON.stringify(row));

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await APIService.adminUnpaidPayouts();
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
      setLoadError("Unable to load unpaid payouts.");
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

  const pay = async () => {
    if (pending.current || refundPending.current || !selected) return;
    pending.current = true;
    refundPending.current = true;
    setSaving(true);
    setError("");
    setResult("");
    try {
      const response = await APIService.adminPayStylistNow({
        appointmentId: selected.appointmentId,
      });
      if (response.data?.statusCode !== "200") {
        setError(response.data?.message || "Unable to send the payout.");
        return;
      }
      setResult(response.data?.message || "Payout sent");
      setSelected(null);
      await load();
    } catch {
      setError("Unable to send the payout. Verify its status before retrying.");
    } finally {
      pending.current = false;
      refundPending.current = false;
      setSaving(false);
    }
  };

  if (!active) return null;

  const startPay = (row) => {
    setSelected(row);
    setError("");
    setResult("");
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="font-semibold">Unpaid stylist payouts</h2>
      <p className="mt-1 mb-4 text-sm text-gray-600">
        Completed bookings whose stylist has not been paid and no payout is
        scheduled. Send one now once the stylist can receive payouts, or after
        checking an older booking was never paid outside the app.
      </p>
      {loading ? (
        <p>Loading unpaid payouts...</p>
      ) : loadError ? (
        <div role="alert">
          {loadError}{" "}
          <button type="button" onClick={load}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {result && (
            <p role="status" className="mb-3 text-sm text-emerald-700">
              {result}
            </p>
          )}
          <AdminListControls list={list} label="Search unpaid payouts" />
          {rows.length === 0 ? (
            <p>No unpaid payouts.</p>
          ) : list.filteredCount === 0 ? (
            <AdminNoMatches list={list} noun="unpaid payouts" />
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
                          {key === "reason" && row[key]
                            ? (REASON_LABELS[row[key]] || row[key])
                            : key === "connectStatus" && row[key]
                              ? <AdminPill tone={connectTone(row[key])}>{row[key]}</AdminPill>
                              : row[key] || "-"}
                        </td>
                      ))}
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={saving || refundPending.current}
                          onClick={() => startPay(row)}
                          className="rounded border px-3 py-2"
                        >
                          Pay now
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
        <section aria-label="Send stylist payout" className="mt-4 rounded border p-4">
          <h3 className="font-semibold">Send payout for {selected.appointmentId}</h3>
          <p className="my-2 text-sm">
            This sends the stylist their share of {selected.stylistShare || "this booking"} now.
            {selected.canReceivePayouts === false
              ? " This stylist has no payout account that can receive payouts yet, so it will be held again until their setup is finished."
              : ""}
          </p>
          {selected.businessName && (
            <p className="my-2 text-sm text-gray-600">Business: {selected.businessName}</p>
          )}
          {error && (
            <p role="alert" className="mb-3 text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={saving || refundPending.current}
            onClick={pay}
            className="rounded bg-brand px-3 py-2 text-white"
          >
            {saving ? "Sending..." : "Confirm payout"}
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
