import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Back from "../../../components/goBack";
import Button from "../../../components/button";
import { APIService } from "../../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../../utils/constant";
import { QUOTE_STATUS, durationText, expiresText, isOpenQuote, visitText } from "../../../utils/quotes";
import QuoteThread, { QuotePhotos } from "../../../components/quoteThread";

/** Where "Book this quote" goes: the professional's profile with the quote's checkout open. */
export const quoteBookingPath = (quote) =>
  `/stylistProfile/${btoa(quote.stylerId)}/${btoa(quote.stylistName || "Professional")}?quote=${encodeURIComponent(quote.quoteRef)}`;

/** The customer's custom quote requests and the prices that came back. */
const MyQuotes = ({ setPageTitle }) => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyRef, setBusyRef] = useState(null);

  useEffect(() => {
    setPageTitle?.("My quotes");
    document.title = "My quotes | RapidStylers";
  }, [setPageTitle]);

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await APIService.customerQuotes();
      setQuotes(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch {
      setLoadError("Could not load your quotes.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const decline = async (quote) => {
    const question = quote.status === "QUOTED" ? "Turn down this price?" : "Cancel this quote request?";
    if (busyRef || !window.confirm(question)) return;
    setBusyRef(quote.quoteRef);
    try {
      const response = await APIService.declineQuote(quote.quoteRef);
      const updated = response.data?.data || { ...quote, status: "DECLINED" };
      setQuotes((current) => current.map((item) => (item.quoteRef === quote.quoteRef ? updated : item)));
      showSuccessToastMessage("Quote closed");
    } catch {
      // APIService shows the reason.
    } finally {
      setBusyRef(null);
    }
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white">
      <div className="border-b border-black/10 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <Back />
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Custom work</p>
            <h1 className="mt-2 text-[clamp(1.25rem,2.5vw,1.75rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
              My quotes
            </h1>
            <p className="mt-2 text-sm text-black/55">
              Ask any professional for a price from their profile. When a price comes back, book it here.
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {loading ? (
          <p role="status" className="text-sm text-black/50">Loading your quotes…</p>
        ) : loadError ? (
          <div role="alert" className="text-sm text-red-700">
            {loadError}{" "}
            <button type="button" className="text-brand underline" onClick={load}>Retry</button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-black/15 p-8 text-center text-sm text-black/55">
            No quotes yet. Open a professional's profile and choose <strong>Request a quote</strong>.
          </div>
        ) : (
          <ul className="grid gap-4">
            {quotes.map((quote) => {
              const status = QUOTE_STATUS[quote.status] || QUOTE_STATUS.EXPIRED;
              const people = Number(quote.noOfPeople) || 1;
              return (
                <li key={quote.quoteRef} className="rounded-lg border border-black/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-onSurface">{quote.serviceName}</p>
                      <p className="mt-0.5 text-xs text-black/55">
                        {quote.stylistName} · {visitText(quote.serviceTime)}
                        {people > 1 ? ` · ${people} people` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.tone}`}>
                      {quote.needsReply ? "New message" : quote.status === "REQUESTED" ? "Waiting for a price" : quote.status === "QUOTED" ? "Price ready" : status.label}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm leading-6 text-black/70">{quote.description}</p>
                  <QuotePhotos photos={quote.photos} />
                  {quote.price && (
                    <div className="mt-3 rounded-md bg-brand/[0.06] px-3 py-2 text-sm">
                      <span className="text-lg font-semibold text-onSurface">${quote.price}</span>
                      <span className="text-black/60"> · {durationText(quote.durationMinutes)}</span>
                      {quote.status === "QUOTED" && expiresText(quote.validUntil) && (
                        <span className="text-black/50"> · {expiresText(quote.validUntil)}</span>
                      )}
                      {quote.note && <p className="mt-1 text-xs text-black/60">“{quote.note}”</p>}
                      {quote.serviceTime === "homeService" && quote.status === "QUOTED" && (
                        <p className="mt-1 text-xs text-black/50">Any travel fee is added at checkout.</p>
                      )}
                    </div>
                  )}
                  {quote.status === "ACCEPTED" && (
                    <p className="mt-2 text-xs text-emerald-700">
                      Booked. See it on your <Link to="/dashboard" className="underline">dashboard</Link>.
                    </p>
                  )}
                  <QuoteThread
                    messages={quote.messages}
                    me="CUSTOMER"
                    otherName={quote.stylistName}
                    open={isOpenQuote(quote)}
                    onSend={async (body) => {
                      try {
                        const response = await APIService.messageQuote(quote.quoteRef, body);
                        const updated = response.data?.data || quote;
                        setQuotes((current) => current.map((item) => (item.quoteRef === quote.quoteRef ? updated : item)));
                        return true;
                      } catch {
                        return false;
                      }
                    }}
                  />
                  {isOpenQuote(quote) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {quote.status === "QUOTED" && (
                        <Link
                          to={quoteBookingPath(quote)}
                          className="inline-flex items-center rounded-md bg-violet-700 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-violet-700/20 hover:bg-violet-800"
                        >
                          Book this quote
                        </Link>
                      )}
                      <Button type="button" size="sm" variant="ghost" onClick={() => decline(quote)} disabled={busyRef === quote.quoteRef}>
                        {quote.status === "QUOTED" ? "No thanks" : "Cancel request"}
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyQuotes;
