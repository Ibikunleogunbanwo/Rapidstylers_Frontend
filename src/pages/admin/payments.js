import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminInput, AdminPill } from "./adminShell";
import { getAuthToken, isAdminRole, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";

/** Refund states as the shell's shared tones, so a completed refund looks the
 *  same here as a completed anything-else looks on the other admin pages. */
const REFUND_TONES = {
  COMPLETED: "positive",
  REQUESTED: "attention",
  FAILED: "negative",
};

const formatMoney = (value) => {
  const num = Number(value || 0);
  return "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const Payments = () => {
  const [tab, setTab] = useState("refunds");
  const [refunds, setRefunds] = useState([]);
  const [refundForm, setRefundForm] = useState({ appointmentId: "", amount: "", reason: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRefunds = async () => {
    try {
      const response = await APIService.adminRefunds();
      setRefunds(response.data?.data || []);
    } catch (error) {
      // APIService displays the error.
    }
  };

  useEffect(() => {
    if (getAuthToken() && isAdminRole()) {
      loadRefunds();
    }
    setLoading(false);
  }, []);

  const issueRefund = async () => {
    const appointmentId = refundForm.appointmentId.trim();
    if (!appointmentId) {
      showErrorToastMessage("Appointment id is required");
      return;
    }
    if (refundForm.amount.trim() && (Number.isNaN(Number(refundForm.amount)) || Number(refundForm.amount) <= 0)) {
      showErrorToastMessage("Refund amount must be a positive number. Leave blank for a full refund");
      return;
    }
    // Step-up: refunds move money, so re-prove the admin password on each request.
    const adminPassword = refundForm.password;
    if (!adminPassword.trim()) {
      showErrorToastMessage("Re-authentication required. Please re-enter your admin password");
      return;
    }
    setSubmitting(true);
    try {
      const response = await APIService.adminRefund({
        appointmentId,
        amount: refundForm.amount.trim() || null,
        reason: refundForm.reason.trim() || null,
      }, adminPassword);
      if (response.data?.statusCode === "200") {
        showSuccessToastMessage(`Refund ${response.data?.data?.amount ? `of ${formatMoney(response.data.data.amount)} ` : ""}processed`);
        setRefundForm({ appointmentId: "", amount: "", reason: "", password: "" });
        loadRefunds();
      } else {
        showErrorToastMessage(response.data?.message || "Refund failed");
      }
    } catch (error) {
      // APIService displays the error.
    } finally {
      setSubmitting(false);
    }
  };

  const runReconciliation = async () => {
    setReconciling(true);
    try {
      const response = await APIService.adminPaymentReconciliation();
      if (response.data?.statusCode === "200") {
        setReport(response.data?.data || null);
        showSuccessToastMessage(response.data?.message || "Reconciliation complete");
      } else {
        setReport(null);
        showErrorToastMessage(response.data?.message || "Reconciliation failed");
      }
    } catch (error) {
      // APIService displays the error.
    } finally {
      setReconciling(false);
    }
  };

  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;

  return (
    <AdminPage eyebrow="Admin" title="Admin payments">
        <div className="mb-5 flex flex-wrap gap-2">
          {[["refunds", `Refunds (${refunds.length})`], ["reconciliation", "Reconciliation"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${tab === value ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600"}`}>{label}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Loading payments...</p>
        ) : tab === "refunds" ? (
          <div className="grid gap-4">
            <div className="rounded-lg border bg-white p-4">
              <p className="font-semibold">Issue a refund</p>
              <p className="mt-1 text-sm text-gray-600">
                Refunds a captured booking payment. Leave the amount blank for a full refund. A completed refund can only be issued once per payment.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block mb-1 text-xs text-gray-500">Appointment id *</label>
                  <AdminInput
                    type="text"
                    value={refundForm.appointmentId}
                    onChange={(e) => setRefundForm({ ...refundForm, appointmentId: e.target.value })}
                    placeholder="e.g. aB3xY"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-gray-500">Amount (blank = full refund)</label>
                  <AdminInput
                    type="number"
                    min="0"
                    step="0.01"
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    placeholder="e.g. 25.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs text-gray-500">Reason</label>
                  <AdminInput
                    type="text"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    placeholder="e.g. Client cancellation"
                  />
                </div>
                <div className="mt-3">
                  <label className="block mb-1 text-xs text-gray-500">Re-authenticate (admin password)</label>
                  <AdminInput
                    type="password"
                    value={refundForm.password}
                    onChange={(e) => setRefundForm({ ...refundForm, password: e.target.value })}
                    placeholder="Re-enter your admin password"
                    autoComplete="current-password"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Refunds move money, so you must re-prove your password on each refund.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={issueRefund}
                disabled={submitting}
                className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                {submitting ? "Processing..." : "Issue refund"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border bg-white">
              {refunds.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No refunds yet.</p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs text-gray-500">
                      <th className="p-3">Refund</th>
                      <th className="p-3">Appointment</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">By</th>
                      <th className="p-3">When</th>
                      <th className="p-3">Stripe ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((refund) => (
                      <tr key={refund.id || refund.refundId} className="border-b align-top last:border-0">
                        <td className="p-3 font-semibold">{refund.refundId}</td>
                        <td className="p-3">{refund.appointmentId}</td>
                        <td className="p-3">{formatMoney(refund.amount)}</td>
                        <td className="p-3">
                          <AdminPill tone={REFUND_TONES[refund.status] || "neutral"}>
                            {refund.status}
                          </AdminPill>
                        </td>
                        <td className="p-3 text-gray-600">{refund.reason || "-"}</td>
                        <td className="p-3 text-gray-600">{refund.createdBy}</td>
                        <td className="p-3 text-gray-500">{refund.createdAt}</td>
                        <td className="p-3 text-xs text-gray-500">{refund.stripeRefundId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">Payment reconciliation</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Cross-checks recent Stripe payment intents against stored bookings. Findings are also emailed to the ops address.
                  </p>
                </div>
                <button type="button" onClick={runReconciliation} disabled={reconciling} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">
                  {reconciling ? "Running..." : "Run reconciliation"}
                </button>
              </div>
            </div>

            {report ? (
              <div className="rounded-lg border bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-gray-500">Ran at {report.runAt}</p>
                  <AdminPill tone={report.ok ? "positive" : "negative"}>
                    {report.ok ? "No issues" : `${report.issueCount} issue${report.issueCount === 1 ? "" : "s"}`}
                  </AdminPill>
                  <p className="text-sm text-gray-600">
                    {report.stripeIntentsChecked} intents checked · {report.matched} matched
                  </p>
                </div>
                {report.issues && report.issues.length > 0 ? (
                  <ul className="mt-3 grid gap-2">
                    {report.issues.map((issue, index) => (
                      <li key={index} className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-gray-500">No drift found in the last {report.windowHours} hours.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No reconciliation report yet. Run one to see results.</p>
            )}
          </div>
        )}
    </AdminPage>
  );
};

export default Payments;
