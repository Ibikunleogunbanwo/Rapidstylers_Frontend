import { useId, useRef, useState } from "react";
import Button from "../../../components/button";
import { APIService } from "../../../hooks/remote/apiService";

const REASON_LIMIT = 1000;

/**
 * The customer's answer to "did this appointment happen?" for a completed
 * booking.
 *
 * Two jobs, in order:
 *
 *  - While the backend still allows one (`disputeWindowEndsAt`), offer the two
 *    answers: confirm it happened, or report a problem.
 *  - Afterwards, report the OUTCOME back to the customer. A resolved dispute
 *    used to say only that it was resolved; the customer now also sees what
 *    they told us and the team's resolution note when the backend supplies
 *    them (`serviceDisputeReason`, `serviceDisputeResolutionNote`,
 *    `serviceDisputeResolvedAt`). Each of those is optional and simply omitted
 *    until the backend exposes it, so this degrades without going blank.
 */
const ServiceOutcome = ({
  appointmentId,
  disputeWindowEndsAt,
  serviceConfirmedAt,
  serviceDisputeStatus,
  serviceDisputeReason,
  serviceDisputeResolutionNote,
  serviceDisputeResolvedAt,
}) => {
  const reasonId = useId();
  const inFlight = useRef(false);
  const [mode, setMode] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState("");

  // The answer to show. A fresh response wins over the stored one so the panel
  // appears immediately, without a reload.
  const outcome =
    result ||
    (serviceDisputeStatus === "OPEN"
      ? "reported"
      : serviceDisputeStatus === "RESOLVED"
      ? "resolved"
      : serviceConfirmedAt
      ? "confirmed"
      : "");

  if (outcome) {
    const sentence =
      outcome === "reported"
        ? "Your problem has been reported and is under review."
        : outcome === "resolved"
        ? "Your service dispute has been resolved."
        : "You confirmed this appointment happened.";
    // The customer's own words: what they just typed, or what the backend kept.
    const whatTheySaid = reason.trim() || serviceDisputeReason;
    return (
      <section
        role="status"
        aria-label="Your response to this appointment"
        className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800"
      >
        <p className="font-medium">{sentence}</p>
        {whatTheySaid && <p className="mt-2">What you told us: {whatTheySaid}</p>}
        {outcome === "resolved" && serviceDisputeResolutionNote && (
          <p className="mt-2">Our response: {serviceDisputeResolutionNote}</p>
        )}
        {outcome === "resolved" && serviceDisputeResolvedAt && (
          <p className="mt-1 text-slate-600">Resolved on {serviceDisputeResolvedAt}</p>
        )}
      </section>
    );
  }

  if (!appointmentId || !disputeWindowEndsAt) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    const report = reason.trim();
    if (mode === "report" && (!report || report.length > REASON_LIMIT)) {
      setError("Tell us what went wrong in 1000 characters or fewer.");
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError("");
    try {
      const response =
        mode === "report"
          ? await APIService.disputeService({ appointmentId, reason: report })
          : await APIService.confirmService(appointmentId);
      if (Number(response?.data?.statusCode) !== 200) {
        throw new Error("Unconfirmed response");
      }
      setResult(mode === "report" ? "reported" : "confirmed");
      setMode("");
    } catch {
      setError(
        "We could not save your response. Refresh your bookings to check the status before trying again.",
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <section
      aria-label="Confirm or report this appointment"
      className="mt-3 rounded-lg border border-slate-300 bg-white p-4 text-sm"
    >
      <p className="font-medium text-slate-900">Did this appointment happen?</p>
      {!mode ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setMode("confirm");
              setError("");
            }}
          >
            It happened
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setMode("report");
              setError("");
            }}
          >
            Report a problem
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3">
          {mode === "confirm" ? (
            <p className="text-slate-700">
              Confirm that you received this service. This allows the
              professional’s payment to be released.
            </p>
          ) : (
            <>
              <label htmlFor={reasonId} className="block font-medium">
                What went wrong?
              </label>
              <textarea
                id={reasonId}
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setError("");
                }}
                maxLength={REASON_LIMIT}
                disabled={pending}
                className="mt-1 min-h-24 w-full rounded border border-slate-400 p-2"
              />
              <p className="mt-1 text-xs text-slate-600">
                {reason.length}/{REASON_LIMIT} characters. Our team will review
                your report before releasing the professional’s payment.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="mt-2 text-red-700">
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={pending}>
              {pending
                ? "Saving…"
                : mode === "report"
                ? "Send report"
                : "Confirm service happened"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setMode("");
                setError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ServiceOutcome;
