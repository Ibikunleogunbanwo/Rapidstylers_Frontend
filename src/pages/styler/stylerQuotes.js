import { useEffect, useState } from "react";
import Button from "../../components/button";
import { APIService } from "../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../utils/constant";
import { DURATION_OPTIONS, QUOTE_STATUS, durationText, expiresText, isOpenQuote, visitText } from "../../utils/quotes";
import { StylerField, StylerSelect } from "./stylerComponents/stylerField";

const TABS = [
  { id: "waiting", label: "Waiting for you", match: (quote) => quote.status === "REQUESTED" },
  { id: "sent", label: "Price sent", match: (quote) => quote.status === "QUOTED" },
  { id: "closed", label: "Closed", match: (quote) => !isOpenQuote(quote) },
];
const VALID_DAY_OPTIONS = [1, 2, 3, 5, 7, 14].map((days) => ({ value: String(days), label: days === 1 ? "1 day" : `${days} days` }));
const PRICE_PATTERN = /^\d{1,5}(\.\d{1,2})?$/;

/**
 * The professional's custom quote requests: price the ones waiting, change or
 * take back a price not yet booked, and see what became a booking.
 */
const StylerQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("waiting");

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await APIService.stylerQuotes();
      const items = response.data?.data?.items;
      setQuotes(Array.isArray(items) ? items : []);
    } catch {
      setLoadError("Could not load your quotes.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const replace = (updated) => setQuotes((current) => current.map((quote) => (quote.quoteRef === updated.quoteRef ? updated : quote)));
  const active = TABS.find((entry) => entry.id === tab) || TABS[0];
  const visible = quotes.filter(active.match);

  return (
    <div className="grid gap-4">
      <p className="text-sm leading-6 text-black/60">
        Clients ask for a quote when a job has no fixed price: a bridal party, extra-long braids, a group booking. Send a
        price and how long it takes. When the client books it, it shows up in Appointments like any other booking.
      </p>
      <div role="tablist" aria-label="Quotes" className="flex flex-wrap gap-2 text-xs">
        {TABS.map((entry) => {
          const count = quotes.filter(entry.match).length;
          const selected = entry.id === tab;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(entry.id)}
              className={`rounded-full px-3 py-2 transition-colors ${
                selected ? "bg-brand/10 font-semibold text-brand" : "text-black/60 hover:bg-black/[0.04] hover:text-onSurface"
              }`}
            >
              {entry.label}
              {count > 0 && <span className="ml-1.5 text-black/40">{count}</span>}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p role="status" className="text-sm text-black/50">Loading quotes…</p>
      ) : loadError ? (
        <div role="alert" className="text-sm text-red-700">
          {loadError}{" "}
          <button type="button" className="text-brand underline" onClick={load}>Retry</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 p-8 text-center text-sm text-black/55">
          {tab === "waiting" ? "No quote requests waiting. New ones will appear here and in Notifications." : "Nothing here yet."}
        </div>
      ) : (
        <ul className="grid gap-4">
          {visible.map((quote) => (
            <li key={quote.quoteRef}>
              <QuoteCard quote={quote} onChanged={replace} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const QuoteCard = ({ quote, onChanged }) => {
  const [pricing, setPricing] = useState(false);
  const [busy, setBusy] = useState(false);
  const status = QUOTE_STATUS[quote.status] || QUOTE_STATUS.EXPIRED;
  const people = Number(quote.noOfPeople) || 1;

  const withdraw = async () => {
    const question = quote.status === "REQUESTED" ? "Turn down this quote request?" : "Take back this price? The client won't be able to book it.";
    if (busy || !window.confirm(question)) return;
    setBusy(true);
    try {
      const response = await APIService.withdrawQuote(quote.quoteRef);
      onChanged(response.data?.data || { ...quote, status: "WITHDRAWN" });
      showSuccessToastMessage("Quote closed");
    } catch {
      // APIService shows the reason.
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-lg border border-black/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-onSurface">{quote.serviceName}</h2>
          <p className="mt-0.5 text-xs text-black/55">
            {quote.clientName} · {visitText(quote.serviceTime)}
            {people > 1 ? ` · ${people} people` : ""}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}>{status.label}</span>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-black/80">{quote.description}</p>
      {quote.preferredDates && (
        <p className="mt-2 text-xs text-black/55">
          <span className="font-medium text-black/70">Preferred:</span> {quote.preferredDates}
        </p>
      )}

      {quote.price && !pricing && (
        <div className="mt-3 rounded-md bg-black/[0.03] px-3 py-2 text-sm">
          <span className="font-semibold">${quote.price}</span> · {durationText(quote.durationMinutes)}
          {quote.status === "QUOTED" && expiresText(quote.validUntil) && (
            <span className="text-black/50"> · {expiresText(quote.validUntil)}</span>
          )}
          {quote.note && <p className="mt-1 text-xs text-black/60">{quote.note}</p>}
        </div>
      )}
      {quote.status === "ACCEPTED" && (
        <p className="mt-2 text-xs text-emerald-700">Booked. Find it in Appointments to confirm the time.</p>
      )}

      {pricing ? (
        <OfferForm quote={quote} onCancel={() => setPricing(false)} onSent={(updated) => { setPricing(false); onChanged(updated); }} />
      ) : (
        isOpenQuote(quote) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => setPricing(true)} disabled={busy}>
              {quote.status === "QUOTED" ? "Change price" : "Send a price"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={withdraw} disabled={busy}>
              {quote.status === "QUOTED" ? "Take back price" : "Can't do this one"}
            </Button>
          </div>
        )
      )}
    </article>
  );
};

const OfferForm = ({ quote, onCancel, onSent }) => {
  const [price, setPrice] = useState(quote.price || "");
  const [duration, setDuration] = useState(String(quote.durationMinutes || 120));
  const [note, setNote] = useState(quote.note || "");
  const [validDays, setValidDays] = useState("3");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    const trimmed = price.trim().replace(/^\$/, "");
    if (!PRICE_PATTERN.test(trimmed)) {
      setError("Enter a price such as 150 or 149.99");
      return;
    }
    setError("");
    setSending(true);
    try {
      const response = await APIService.offerQuote({
        quoteRef: quote.quoteRef,
        price: trimmed,
        durationMinutes: Number(duration),
        note: note.trim(),
        validDays: Number(validDays),
      });
      showSuccessToastMessage(response.data?.message || "Quote sent");
      onSent(response.data?.data || quote);
    } catch {
      // APIService shows the reason.
    } finally {
      setSending(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="mt-4 grid gap-3 rounded-md border border-brand/20 bg-brand/[0.03] p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StylerField
          label="Price (CAD)"
          name="price"
          inputMode="decimal"
          placeholder="e.g. 180"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          error={error}
        />
        <StylerSelect
          label="Takes about"
          name="duration"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          options={DURATION_OPTIONS.map((minutes) => ({ value: String(minutes), label: durationText(minutes) }))}
        />
        <StylerSelect
          label="Price holds for"
          name="validDays"
          value={validDays}
          onChange={(event) => setValidDays(event.target.value)}
          options={VALID_DAY_OPTIONS}
        />
      </div>
      <StylerField
        label="Note for the client (optional)"
        name="note"
        maxLength={500}
        placeholder="What's included, what to bring"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <p className="text-xs text-black/50">
        This is the price for the whole job{Number(quote.noOfPeople) > 1 ? `, all ${quote.noOfPeople} people` : ""}. Your
        usual travel fee is added for home visits, and the platform fee comes out of it as with any booking.
      </p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={sending}>{sending ? "Sending…" : "Send quote"}</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={sending}>Cancel</Button>
      </div>
    </form>
  );
};

export default StylerQuotes;
