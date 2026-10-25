import { useState } from "react";
import Button from "./button";
import { cloudinarySquare } from "../utils/cloudinaryImage";

const MAX_MESSAGE = 500;

/** The customer's reference photos, as small squares that open full size in a new tab. */
export const QuotePhotos = ({ photos }) => {
  if (!Array.isArray(photos) || photos.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2" aria-label="Reference photos">
      {photos.map((url, index) => (
        <li key={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={cloudinarySquare(url) || url}
              alt={`Reference photo ${index + 1}`}
              className="h-20 w-20 rounded-md border border-black/10 object-cover"
              loading="lazy"
            />
          </a>
        </li>
      ))}
    </ul>
  );
};

const timeText = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

/**
 * The short conversation on a quote. `me` is "CUSTOMER" or "STYLIST" and says
 * which bubbles are this person's. `onSend(body)` resolves to true when the
 * message was saved; the box is shown only while the quote is open.
 */
const QuoteThread = ({ messages = [], me, otherName, open, onSend }) => {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState(messages.length > 0);

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      if (await onSend(body)) setDraft("");
    } finally {
      setSending(false);
    }
  };

  if (!open && messages.length === 0) return null;
  if (!expanded) {
    return (
      <button type="button" className="mt-3 text-xs font-semibold text-brand hover:underline" onClick={() => setExpanded(true)}>
        Ask {otherName || "them"} a question
      </button>
    );
  }
  return (
    <div className="mt-3 grid gap-2 rounded-md border border-black/10 p-3">
      {messages.length > 0 && (
        <ol className="grid gap-2" aria-label="Messages">
          {messages.map((message, index) => {
            const mine = message.from === me;
            return (
              <li key={`${message.createdAt}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-brand/10 text-onSurface" : "bg-black/[0.04] text-onSurface"}`}>
                  <p className="whitespace-pre-line break-words">{message.body}</p>
                  <p className="mt-1 text-[11px] text-black/45">{mine ? "You" : otherName} · {timeText(message.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {open ? (
        <form onSubmit={send} className="flex items-end gap-2">
          <label className="sr-only" htmlFor={`quote-message-${me}`}>Message</label>
          <textarea
            id={`quote-message-${me}`}
            rows={2}
            maxLength={MAX_MESSAGE}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Message ${otherName || ""}`.trim()}
            className="min-h-[44px] flex-1 rounded-md border border-slate-400 bg-white p-2 text-sm focus:outline-brand"
          />
          <Button type="submit" size="sm" disabled={sending || !draft.trim()}>{sending ? "Sending…" : "Send"}</Button>
        </form>
      ) : (
        <p className="text-xs text-black/45">This quote is closed, so messages are off.</p>
      )}
    </div>
  );
};

export default QuoteThread;
