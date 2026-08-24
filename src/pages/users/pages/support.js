import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showSuccessToastMessage } from "../../../utils/constant";

const Support = ({ setPageTitle }) => {
  const [form, setForm] = useState({ subject: "", message: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadTickets = async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    try {
      const response = await APIService.listSupportTickets();
      setTickets(response.data?.data || []);
    } catch (error) {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle("Support");
    document.title = "Support | RapidStylers";
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.message.trim() || submitting) return;
    setErrorMsg("");
    setSubmitting(true);
    try {
      await APIService.createSupportTicket({ subject: form.subject.trim(), message: form.message.trim() });
      setForm({ subject: "", message: "" });
      showSuccessToastMessage("Support ticket submitted");
      await loadTickets();
    } catch (error) {
      setErrorMsg(error?.response?.data?.message || error?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-1 border-b bg-[#1d1d1d08] p-4 text-[15px] font-bold"><Back /><span>Support</span></div>
      <div className="grid gap-6 p-4">
        {!getAuthToken() ? <p className="text-sm text-gray-500">Please sign in to contact support.</p> : <>
          <form onSubmit={submit} className="grid gap-3">
            <div><p className="font-semibold">Contact support</p><p className="mt-1 text-sm text-gray-500">Tell us what happened and include the appointment number when relevant.</p></div>
            <input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="Subject" maxLength={120} className="rounded-md border px-3 py-2 text-sm outline-none focus:border-brand" required />
            <textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Describe the issue" maxLength={2000} rows={5} className="rounded-md border px-3 py-2 text-sm outline-none focus:border-brand" required />
            {errorMsg && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{errorMsg}</span>
              </div>
            )}
            <button type="submit" disabled={submitting} className="w-fit rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Sending..." : "Submit ticket"}</button>
          </form>
          <div>
            <p className="mb-3 font-semibold">Your tickets</p>
            {loading ? <p className="text-sm text-gray-500">Loading tickets...</p> : tickets.length === 0 ? <p className="text-sm text-gray-500">No support tickets yet.</p> : <div className="grid gap-3">{tickets.map((ticket) => (
              <div key={ticket.id} className="rounded-md border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-gray-900">{ticket.subject}</p><span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{ticket.status}</span></div>
                <p className="mt-2 text-sm text-gray-600">{ticket.message}</p>
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
