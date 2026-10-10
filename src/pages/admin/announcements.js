import { useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminPage } from "./adminShell";
import { getAuthToken, isAdminRole } from "../../utils/constant";

/**
 * Admin announcements: a message that lands in customers' Notifications tab.
 * In-app only (no email). Goes to every active customer, or to one customer
 * found by email. Sending to everyone asks first, since it cannot be recalled.
 */
const Announcements = () => {
  document.title = "Announcements | RapidStylers";
  const [audience, setAudience] = useState("all");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const pending = useRef(false);

  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;

  const send = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    setError("");
    setResult("");
    if (!title.trim() || !message.trim()) { setError("Add a title and a message."); return; }
    if (audience === "one" && !recipientEmail.trim()) { setError("Enter the customer's email."); return; }
    if (audience === "all" && !window.confirm("Send this to every active customer? It cannot be recalled.")) return;
    pending.current = true;
    setSending(true);
    try {
      const response = await APIService.adminSendAnnouncement({
        title: title.trim(),
        message: message.trim(),
        recipientEmail: audience === "one" ? recipientEmail.trim() : "",
      });
      if (String(response.data?.statusCode) !== "200") throw new Error(response.data?.message || "Unable to send");
      const sent = response.data?.data?.sent ?? 0;
      setResult(`Sent to ${sent} customer${sent === 1 ? "" : "s"}.`);
      setTitle("");
      setMessage("");
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to send the announcement.");
    } finally {
      pending.current = false;
      setSending(false);
    }
  };

  return (
    <AdminPage eyebrow="Admin" title="Announcements">
      <form onSubmit={send} className="grid max-w-2xl gap-4 rounded-lg border bg-white p-4">
        <fieldset className="grid gap-2 text-sm">
          <legend className="mb-1 font-semibold text-gray-800">Send to</legend>
          <label className="flex items-center gap-2"><input type="radio" name="audience" value="all" checked={audience === "all"} onChange={() => setAudience("all")} /> All active customers</label>
          <label className="flex items-center gap-2"><input type="radio" name="audience" value="one" checked={audience === "one"} onChange={() => setAudience("one")} /> One customer</label>
        </fieldset>
        {audience === "one" && (
          <label className="grid gap-1 text-sm font-semibold text-gray-800">Customer email
            <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="rounded border px-3 py-2 font-normal" />
          </label>
        )}
        <label className="grid gap-1 text-sm font-semibold text-gray-800">Title
          <input type="text" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-gray-800">Message
          <textarea maxLength={1000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="rounded border px-3 py-2 font-normal" />
          <span className="text-xs font-normal text-gray-400">{message.length}/1000 · Shows in the customer's Notifications tab. No email is sent.</span>
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {result && <p role="status" className="text-sm text-green-700">{result}</p>}
        <div><button type="submit" disabled={sending} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? "Sending…" : "Send announcement"}</button></div>
      </form>
    </AdminPage>
  );
};

export default Announcements;
