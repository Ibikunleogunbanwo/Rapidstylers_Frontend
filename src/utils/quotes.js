// Shared wording for custom quotes, so the stylist and customer screens agree.

export const QUOTE_STATUS = {
  REQUESTED: { label: "Waiting for a price", tone: "text-amber-600 bg-amber-50" },
  QUOTED: { label: "Price sent", tone: "text-brand bg-brand/10" },
  ACCEPTED: { label: "Booked", tone: "text-emerald-700 bg-emerald-50" },
  DECLINED: { label: "Closed by client", tone: "text-black/55 bg-black/[0.05]" },
  WITHDRAWN: { label: "Closed by professional", tone: "text-black/55 bg-black/[0.05]" },
  EXPIRED: { label: "Expired", tone: "text-black/55 bg-black/[0.05]" },
};

export const isOpenQuote = (quote) => quote?.status === "REQUESTED" || quote?.status === "QUOTED";

export const durationText = (minutes) => {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  return `${hours} ${hours === 1 ? "hour" : "hours"}${rest ? ` ${rest} min` : ""}`;
};

/** "Expires Mar 4" for a UTC instant, or "" when there is none. */
export const expiresText = (validUntil) => {
  if (!validUntil) return "";
  const date = new Date(validUntil);
  if (Number.isNaN(date.getTime())) return "";
  return `Expires ${date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`;
};

export const visitText = (serviceTime) => (serviceTime === "homeService" ? "Home visit" : "At the studio");

// Whole quarter hours from 15 minutes to 8 hours, matching what the server accepts.
export const DURATION_OPTIONS = Array.from({ length: 32 }, (_, index) => (index + 1) * 15);
