import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { AdminCard, AdminPage, AdminPill } from "./adminShell";
import { formatAdminTime } from "./adminFormat";
import { getAuthToken, isAdminRole } from "../../utils/constant";

/**
 * Who an announcement goes to: everyone in an audience, or one person in it
 * found by email. `audience` is what the backend calls the group.
 */
const AUDIENCES = {
  customers: { label: "All customers", audience: "CUSTOMERS", one: false, noun: "customer" },
  customer: { label: "One customer", audience: "CUSTOMERS", one: true, noun: "customer" },
  stylists: { label: "All stylists", audience: "STYLISTS", one: false, noun: "stylist" },
  stylist: { label: "One stylist", audience: "STYLISTS", one: true, noun: "stylist" },
};
const nounFor = audience => String(audience || "").toUpperCase() === "STYLISTS" ? "stylist" : "customer";
const capital = text => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Admin announcements: a message that lands in customers' Notifications tab,
 * or in the Notifications page of stylists' dashboards. In-app only (no email).
 * Goes to every active customer or stylist, or to one found by email. Send
 * stays disabled until there is a title and a message; sending to a whole
 * audience asks first with the number of people it will reach, since it cannot
 * be recalled. Past sends are listed below the form with their audience.
 */
const Announcements = () => {
  const authorized = Boolean(getAuthToken() && isAdminRole());
  const [choice, setChoice] = useState("customers");
  const target = AUDIENCES[choice];
  const [recipientEmail, setRecipientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const pending = useRef(false);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = () => {
    setHistoryError("");
    AdminAPI.announcements()
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => { setHistory(null); setHistoryError("Unable to load sent announcements."); });
  };
  useEffect(() => { if (authorized) loadHistory(); }, [authorized]);

  if (!authorized) return <Navigate to="/admin/login" replace />;
  const ready = Boolean(title.trim() && message.trim() && (!target.one || recipientEmail.trim()));

  /** "Send this to 1,204 active customers?"; when the count is unavailable the prompt still asks, without a number. */
  const confirmEveryone = async () => {
    let count = null;
    try { count = (await AdminAPI.announcementAudienceCount(target.audience))?.count ?? null; } catch { count = null; }
    const who = Number.isFinite(count) ? `${count.toLocaleString()} active ${target.noun}${count === 1 ? "" : "s"}` : `every active ${target.noun}`;
    return window.confirm(`Send this to ${who}? It cannot be recalled.`);
  };

  const send = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    setError("");
    setResult("");
    if (!title.trim() || !message.trim()) { setError("Add a title and a message."); return; }
    if (target.one && !recipientEmail.trim()) { setError(`Enter the ${target.noun}'s email.`); return; }
    pending.current = true;
    setSending(true);
    try {
      if (!target.one && !(await confirmEveryone())) return;
      const response = await APIService.adminSendAnnouncement({
        title: title.trim(),
        message: message.trim(),
        recipientEmail: target.one ? recipientEmail.trim() : "",
        audience: target.audience,
      });
      if (String(response.data?.statusCode) !== "200") throw new Error(response.data?.message || "Unable to send");
      const sent = response.data?.data?.sent ?? 0;
      setResult(`Sent to ${sent} ${target.noun}${sent === 1 ? "" : "s"}.`);
      setTitle("");
      setMessage("");
      loadHistory();
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
          {Object.entries(AUDIENCES).map(([key, option]) => (
            <label key={key} className="flex items-center gap-2"><input type="radio" name="audience" value={key} checked={choice === key} onChange={() => setChoice(key)} /> {option.label}</label>
          ))}
        </fieldset>
        {target.one && (
          <label className="grid gap-1 text-sm font-semibold text-gray-800">{capital(target.noun)} email
            <input type="email" required value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="rounded border px-3 py-2 font-normal" />
          </label>
        )}
        <label className="grid gap-1 text-sm font-semibold text-gray-800">Title
          <input type="text" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2 font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-gray-800">Message
          <textarea required maxLength={1000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="rounded border px-3 py-2 font-normal" />
          <span className="text-xs font-normal text-gray-400">{message.length}/1000 · {target.noun === "stylist" ? "Shows on the Notifications page of the stylist's dashboard." : "Shows in the customer's Notifications tab."} No email is sent.</span>
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {result && <p role="status" className="text-sm text-green-700">{result}</p>}
        <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={sending || !ready} className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? "Sending…" : "Send announcement"}</button>{!ready && <span className="text-xs text-gray-500">Add a title and a message{target.one ? ` and the ${target.noun}'s email` : ""} to send.</span>}</div>
      </form>
      <AdminCard className="mt-6 max-w-2xl" pad="p-4">
        <h2 className="text-lg font-medium text-gray-900">Sent announcements</h2>
        {historyError ? <p role="alert" className="mt-2 text-sm text-red-700">{historyError} <button type="button" onClick={loadHistory} className="underline">Retry</button></p>
          : !history ? <p className="mt-2 text-sm text-gray-500">Loading…</p>
          : history.length === 0 ? <p className="mt-2 text-sm text-gray-500">Nothing sent yet.</p>
          : <ul className="mt-2 divide-y">{history.map((item, index) => (
            <li key={`${item.sentAt}-${index}`} className="py-3 text-sm">
              <div className="flex items-start justify-between gap-3"><p className="min-w-0 font-semibold text-gray-900 break-words">{item.title}</p><AdminPill tone={nounFor(item.audience) === "stylist" ? "attention" : "neutral"}>{nounFor(item.audience) === "stylist" ? "Stylists" : "Customers"}</AdminPill></div>
              <p className="mt-1 whitespace-pre-line break-words text-gray-600">{item.message}</p>
              <p className="mt-1 text-xs text-gray-500">{formatAdminTime(item.sentAt)} · {item.recipientEmail ? `To ${item.recipientEmail}` : `All ${nounFor(item.audience)}s`} · {Number(item.recipientCount ?? 0).toLocaleString()} recipient{item.recipientCount === 1 ? "" : "s"}{item.sentBy ? ` · by ${item.sentBy}` : ""}</p>
            </li>
          ))}</ul>}
      </AdminCard>
    </AdminPage>
  );
};

export default Announcements;
