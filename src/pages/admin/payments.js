import ServiceDisputes from "./serviceDisputes";
import UnpaidPayouts from "./unpaidPayouts";
import { useAdminList, AdminListControls } from "./adminList";
import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage, AdminInput, AdminPill } from "./adminShell";
import { getAuthToken, isAdminRole, showSuccessToastMessage } from "../../utils/constant";

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
  const [params, setParams] = useSearchParams();
  const tab = ["reconciliation", "disputes", "unpaidPayouts"].includes(params.get("section")) ? params.get("section") : "refunds";
  const setTab = value => setParams(value === "refunds" ? {} : {section:value});
  const [refunds, setRefunds] = useState([]);
  const [refundForm, setRefundForm] = useState({ appointmentId: "", amount: "", reason: "", password: "", recoverStylistShare: false });
  const [submitting, setSubmitting] = useState(false);
  const [review, setReview] = useState(null);
  const [refundError, setRefundError] = useState("");
  const [reconciliationError, setReconciliationError] = useState("");
  const refundPending = useRef(false);
  const reconciliationPending = useRef(false);
  const [report, setReport] = useState(null);
  const [reconciling, setReconciling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadRefunds = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await APIService.adminRefunds();
      setRefunds(response.data?.data || []);
    } catch (error) {
      setLoadError("Unable to load refunds.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getAuthToken() && isAdminRole()) {
      loadRefunds();
    } else setLoading(false);
  }, []);

  const reviewRefund = () => {
    setRefundError("");
    setRefundForm((form) => ({ ...form, password: "" }));
    const appointmentId = refundForm.appointmentId.trim();
    if (!appointmentId) {
      setRefundError("Appointment id is required.");
      return;
    }
    const amount = refundForm.amount.trim();
    if (amount && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
      setRefundError("Refund amount must be a positive number. Leave blank for a full refund.");
      return;
    }
    setReview({ appointmentId, amount: amount || null, reason: refundForm.reason.trim() || null, recoverStylistShare: refundForm.recoverStylistShare });
  };

  const issueRefund = async () => {
    if (refundPending.current || !review) return;
    const adminPassword = refundForm.password;
    setRefundForm((form) => ({ ...form, password: "" }));
    setRefundError("");
    if (!adminPassword.trim()) {
      setRefundError("Re-authentication required. Please re-enter your admin password.");
      return;
    }
    refundPending.current = true;
    setSubmitting(true);
    try {
      const response = await APIService.adminRefund(review, adminPassword);
      if (response.data?.statusCode === "200") {
        showSuccessToastMessage(`Refund ${response.data?.data?.amount ? `of ${formatMoney(response.data.data.amount)} ` : ""}processed`);
        setRefundForm({ appointmentId: "", amount: "", reason: "", password: "", recoverStylistShare: false });
        setReview(null);
        loadRefunds();
      } else {
        setRefundError(response.data?.message || "Refund failed.");
      }
    } catch (error) {
      setRefundError("Refund request failed. Verify the payment status before retrying.");
    } finally {
      refundPending.current = false;
      setSubmitting(false);
    }
  };

  const runReconciliation = async () => {
    if (reconciliationPending.current) return;
    reconciliationPending.current = true;
    setReconciliationError("");
    setReport(null);
    setReconciling(true);
    try {
      const response = await APIService.adminPaymentReconciliation();
      if (response.data?.statusCode === "200") {
        setReport(response.data?.data || null);
        showSuccessToastMessage(response.data?.message || "Reconciliation complete");
      } else {
        setReport(null);
        setReconciliationError(response.data?.message || "Reconciliation failed.");
      }
    } catch (error) {
      setReconciliationError("Unable to run reconciliation.");
    } finally {
      reconciliationPending.current = false;
      setReconciling(false);
    }
  };

  const refundList = useAdminList(refunds, row => JSON.stringify(row));

  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;

  return (
    <AdminPage eyebrow="Admin" title="Admin payments">
        <div className="mb-5 flex flex-wrap gap-2">
          {[["refunds", `Refunds (${refunds.length})`], ["reconciliation", "Reconciliation"], ["disputes", "Disputes"], ["unpaidPayouts", "Unpaid payouts"]].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${tab === value ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600"}`}>{label}</button>
          ))}
        </div>

        <ServiceDisputes active={tab === "disputes"} refundPending={refundPending} onRefund={row => { if (refundPending.current) return; setReview(null); setRefundError(""); setRefundForm(form => form.appointmentId.trim() === row.appointmentId ? ({ ...form, appointmentId: row.appointmentId, password: "" }) : ({ appointmentId: row.appointmentId, amount: "", reason: "", recoverStylistShare: false, password: "" })); setTab("refunds"); }} />
        <UnpaidPayouts active={tab === "unpaidPayouts"} refundPending={refundPending} />
        {tab === "disputes" || tab === "unpaidPayouts" ? null : loading ? (
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
                  <label htmlFor="refund-appointmentId" className="block mb-1 text-xs text-gray-500">Appointment id *</label>
                  <AdminInput
                    type="text"
                    id="refund-appointmentId"
                    aria-describedby={refundError ? "refund-error" : undefined}
                    disabled={submitting || Boolean(review)}
                    value={refundForm.appointmentId}
                    onChange={(e) => setRefundForm({ ...refundForm, appointmentId: e.target.value })}
                    placeholder="e.g. aB3xY"
                  />
                </div>
                <div>
                  <label htmlFor="refund-amount" className="block mb-1 text-xs text-gray-500">Amount (blank = full refund)</label>
                  <AdminInput
                    type="number"
                    min="0"
                    step="0.01"
                    id="refund-amount"
                    aria-describedby={refundError ? "refund-error" : undefined}
                    disabled={submitting || Boolean(review)}
                    value={refundForm.amount}
                    onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                    placeholder="e.g. 25.00"
                  />
                </div>
                <div>
                  <label htmlFor="refund-reason" className="block mb-1 text-xs text-gray-500">Reason</label>
                  <AdminInput
                    type="text"
                    id="refund-reason"
                    disabled={submitting || Boolean(review)}
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                    placeholder="e.g. Client cancellation"
                  />
                </div>
                {review && <div className="mt-3">
                  <label htmlFor="refund-password" className="block mb-1 text-xs text-gray-500">Re-authenticate (admin password)</label>
                  <AdminInput
                    type="password"
                    id="refund-password"
                    autoFocus
                    aria-describedby={refundError ? "refund-error" : undefined}
                    disabled={submitting}
                    value={refundForm.password}
                    onChange={(e) => setRefundForm({ ...refundForm, password: e.target.value })}
                    placeholder="Re-enter your admin password"
                    autoComplete="current-password"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Enter your password to confirm this refund.</p>
                </div>
                }
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" aria-describedby="recover-share-help" checked={refundForm.recoverStylistShare} disabled={submitting || Boolean(review)} onChange={event => setRefundForm({ ...refundForm, recoverStylistShare: event.target.checked })} />Recover the stylist’s share</label>
              <p id="recover-share-help" className="mt-1 text-sm text-gray-600">Recovery is optional; the backend determines the stylist share available for recovery.</p>
              {refundError && <p id="refund-error" role="alert" className="mt-3 text-sm text-red-700">{refundError}</p>}
              {review && (
                <section aria-label="Review refund" className="mt-3 rounded-md border p-3">
                  <h2 className="font-semibold">Review entered refund details</h2>
                  <dl><dt>Appointment id</dt><dd>{review.appointmentId}</dd><dt>Amount</dt><dd>{review.amount || "Full refund (captured amount unavailable)"}</dd><dt>Reason</dt><dd>{review.reason || "No reason entered"}</dd><dt>Recover the stylist’s share: {review.recoverStylistShare ? "Yes" : "No"}</dt></dl>
                  <p className="mt-2 text-sm text-gray-600">Check the customer, currency and available refund amount in your payment records before confirming. Only the details you entered are shown here.</p>
                  <button type="button" disabled={submitting} onClick={() => { setReview(null); setRefundError(""); setRefundForm((form) => ({ ...form, password: "" })); }} className="mt-2 rounded-md border px-3 py-2">Edit refund</button>
                </section>
              )}
              <button
                type="button"
                onClick={review ? issueRefund : reviewRefund}
                disabled={submitting}
                className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
              >
                {submitting ? "Processing..." : review ? "Confirm refund" : "Review refund"}
              </button>
            </div>

            <div className="rounded-lg border bg-white p-4">
              {!loading && !loadError && <AdminListControls list={refundList} label="Search refunds" />}
              <div className="overflow-x-auto">
              {loadError ? (<div role="alert">{loadError} <button type="button" onClick={loadRefunds}>Retry</button></div>) : refunds.length === 0 ? (
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
                    {refundList.visibleItems.map((refund) => (
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

            {reconciliationError && <p role="alert">{reconciliationError}</p>}
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
