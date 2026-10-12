import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { ApiClient } from "../../../hooks/remote/apiClient";
import { getAuthToken, getUserRole, showSuccessToastMessage } from "../../../utils/constant";

// The server's limits (SupportTicketService), shown as counters under the fields.
const SUBJECT_LIMIT = 120;
const MESSAGE_LIMIT = 2000;

const appointmentLabel = (appointment) =>
  [appointment?.stylerData?.businessName, appointment?.subServiceData?.name, appointment?.appointmentDate].filter(Boolean).join(" · ");

const Support = ({ setPageTitle }) => {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // Optional: the booking the ticket is about. There is no appointment field on
  // a ticket, so the choice is written as the message's first line for support.
  const [appointments, setAppointments] = useState([]);
  const [appointmentId, setAppointmentId] = useState("");

  const loadTickets = async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    try {
      const response = await APIService.listSupportTickets();
      if (!Array.isArray(response.data?.data)) throw new Error("Invalid tickets");
      setTickets(response.data.data);
    } catch (error) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle("Support");
    document.title = "Support | RapidStylers";
    loadTickets();
    if (getAuthToken() && getUserRole() === "CUSTOMER") {
      // Best effort and silent: without the list the picker is simply hidden.
      ApiClient.get("/user_appointments")
        .then((response) => { if (Array.isArray(response?.data?.data)) setAppointments(response.data.data.filter((item) => item?.appointmentId)); })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appointmentLine = (() => {
    const chosen = appointments.find((item) => String(item.appointmentId) === appointmentId);
    return chosen ? `Appointment ${chosen.appointmentId}${appointmentLabel(chosen) ? ` (${appointmentLabel(chosen)})` : ""}` : "";
  })();
  // The appointment line counts towards the server's message limit.
  const messageLimit = appointmentLine ? MESSAGE_LIMIT - appointmentLine.length - 2 : MESSAGE_LIMIT;

  const submit = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim() || submitting) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      const message = [appointmentLine, form.message.trim()].filter(Boolean).join("\n\n");
      await APIService.createSupportTicket({ subject: form.subject.trim(), message });
      setForm({ subject: "", message: "" });
      setAppointmentId("");
      showSuccessToastMessage("Support ticket submitted");
      await loadTickets();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Support</h1>
            <p className="mt-0.5 text-xs text-gray-500">We are here to help</p>
          </div>
        </div>
      </div>
      <div className="grid gap-6 p-4">
        {!getAuthToken() ? <p className="text-sm text-gray-500">Please sign in to contact support.</p> : <>
          <form onSubmit={submit} className="grid gap-3">
            <div><p className="font-semibold">Contact support</p><p className="mt-1 text-sm text-gray-500">Tell us what happened and, when it is about a booking, which appointment.</p></div>
            <p className="text-xs text-gray-500">Fields marked <span aria-hidden="true" className="text-red-600">*</span><span className="sr-only">with an asterisk</span> are required.</p>
            <div className="grid gap-1">
              <label htmlFor="support-subject" className="text-sm font-medium">Subject <span aria-hidden="true" className="text-red-600">*</span></label>
              <input id="support-subject" aria-describedby="support-subject-count" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="For example: Refund for a cancelled booking" maxLength={SUBJECT_LIMIT} className="rounded-md border px-3 py-2 text-sm outline-none focus:border-brand" required />
              <span id="support-subject-count" className="text-right text-[11px] tabular-nums text-gray-400">{form.subject.length}/{SUBJECT_LIMIT}</span>
            </div>
            {appointments.length > 0 && (
              <div className="grid gap-1">
                <label htmlFor="support-appointment" className="text-sm font-medium">Related appointment <span className="font-normal text-gray-500">(optional)</span></label>
                <select id="support-appointment" value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} className="rounded-md border bg-white px-3 py-2 text-sm outline-none focus:border-brand">
                  <option value="">Not about a specific appointment</option>
                  {appointments.map((item) => (
                    <option key={item.appointmentId} value={String(item.appointmentId)}>{appointmentLabel(item) || `Appointment ${item.appointmentId}`}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid gap-1">
              <label htmlFor="support-message" className="text-sm font-medium">Describe the issue <span aria-hidden="true" className="text-red-600">*</span></label>
              <textarea id="support-message" aria-describedby="support-message-count" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="What happened, and what would you like us to do?" maxLength={messageLimit} rows={5} className="rounded-md border px-3 py-2 text-sm outline-none focus:border-brand" required />
              <span id="support-message-count" className="text-right text-[11px] tabular-nums text-gray-400">{form.message.length}/{messageLimit}</span>
            </div>
            {errorMsg && (
              <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{errorMsg}</span>
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-fit rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Sending..." : "Submit ticket"}</button>
          </form>
          <div>
            <p className="mb-3 font-semibold">Your tickets</p>
            {loading ? <p className="text-sm text-gray-500">Loading tickets...</p> : loadError ? <div role="alert">Unable to load support tickets. <button type="button" onClick={loadTickets}>Retry</button></div> : tickets.length === 0 ? <p className="text-sm text-gray-500">No support tickets yet.</p> : <div className="grid gap-3">{tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-gray-900">{ticket.subject}</p><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{ticket.status}</span></div>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{ticket.message}</p>
                {ticket.adminResponse && <p className="mt-2 border-l-2 border-brand pl-2 text-sm text-gray-700">{ticket.adminResponse}</p>}
                <p className="mt-2 text-[11px] text-gray-400">Updated {ticket.updatedAt}</p>
              </div>
            ))}</div>}
          </div>
        </>}
      </div>
    </div>
  );
};

export default Support;
