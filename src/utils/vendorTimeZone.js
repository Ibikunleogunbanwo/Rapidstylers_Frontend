/**
 * The time zone a vendor's weekly hours live in, from their business province.
 *
 * Availability rows carry bare local times ("09:00") with no zone, so any
 * client-side "is this vendor open right now" check must read the clock in the
 * vendor's zone. The browser's clock belongs to the visitor: a Toronto visitor
 * checking a Calgary vendor at 6pm would otherwise see "closed" for a shop
 * that is still open for another two hours. This map mirrors the backend's
 * VendorZoneResolver so both sides always agree; keep them in sync.
 *
 * Canada is the service area today; unknown or missing provinces fall back to
 * the app default (America/Edmonton) exactly like the backend, so behaviour
 * never diverges on unexpected data.
 */

export const DEFAULT_VENDOR_ZONE = "America/Edmonton";

const ZONES_BY_PROVINCE = {
  // Province names exactly as signup and address autocomplete write them.
  alberta: "America/Edmonton",
  "british columbia": "America/Vancouver",
  manitoba: "America/Winnipeg",
  "new brunswick": "America/Moncton",
  "newfoundland and labrador": "America/St_Johns",
  "nova scotia": "America/Halifax",
  ontario: "America/Toronto",
  "prince edward island": "America/Halifax",
  quebec: "America/Toronto",
  saskatchewan: "America/Regina",
  "northwest territories": "America/Yellowknife",
  nunavut: "America/Iqaluit",
  yukon: "America/Whitehorse",
  // Abbreviations.
  ab: "America/Edmonton",
  bc: "America/Vancouver",
  mb: "America/Winnipeg",
  nb: "America/Moncton",
  nl: "America/St_Johns",
  ns: "America/Halifax",
  on: "America/Toronto",
  pe: "America/Halifax",
  qc: "America/Toronto",
  sk: "America/Regina",
  nt: "America/Yellowknife",
  nu: "America/Iqaluit",
  yt: "America/Whitehorse",
};

export const vendorTimeZoneForProvince = (province) => {
  if (!province) return DEFAULT_VENDOR_ZONE;
  const key = String(province).trim().toLowerCase();
  if (!key) return DEFAULT_VENDOR_ZONE;
  return ZONES_BY_PROVINCE[key] || DEFAULT_VENDOR_ZONE;
};

/**
 * The vendor's calendar right now, as plain fields — {year, month (0-11),
 * day, weekday (0=Sun)}. A visitor in Toronto at 11:30pm on the 2nd faces a
 * Vancouver stylist whose calendar still says 9:30pm on the 2nd; a Toronto
 * visitor at 12:30am on the 3rd faces the same stylist on "their" 2nd. Every
 * date-strip decision (what counts as past, which cell is today) must use
 * these fields, not the browser's, so the two calendars cannot silently
 * disagree. Returns browser-date fields when Intl cannot resolve the zone —
 * the same degradation the open-now filter applies.
 */
export const vendorCalendarToday = (stylist, now = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: vendorTimeZone(stylist),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).formatToParts(now);
    const get = (type) => (parts.find((p) => p.type === type) || {}).value;
    const year = Number(get("year"));
    const month = Number(get("month")) - 1;
    const day = Number(get("day"));
    const weekdayNames = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const weekday = weekdayNames[get("weekday")];
    if ([year, month, day].some(Number.isNaN) || weekday === undefined) return null;
    return { year, month, day, weekday };
  } catch {
    return null;
  }
};

/**
 * Human-readable name for a vendor's time zone ("Mountain Time",
 * "Eastern Time"...). `longGeneric` deliberately omits the DST marker so the
 * label stays true year-round — the zone is the contract, not the offset.
 * Returns "" when Intl cannot name the zone (never blocks a render).
 */
export const vendorTimeZoneLabel = (stylist) => {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: vendorTimeZone(stylist),
      timeZoneName: "longGeneric",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return (part && part.value) || "";
  } catch {
    return "";
  }
};

/**
 * Strict label for surfaces that DISPLAY a stored appointment's times (cards,
 * confirmations): stored zone first, then the province map — but never the
 * app default. Unlike the booking pickers (where America/Edmonton is the
 * actual assumption the system applies), a row with no zone data has an
 * unknown clock, and printing "Mountain Time" could be wrong. Returns ""
 * when nothing is known; callers render the time bare.
 */
export const vendorTimeZoneLabelStrict = (stylist) => {
  const stored = stylist && stylist.timeZone;
  if (stored && typeof stored === "string") {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: stored });
      const part = new Intl.DateTimeFormat("en-US", {
        timeZone: stored,
        timeZoneName: "longGeneric",
      })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName");
      return (part && part.value) || "";
    } catch {
      // fall through to the province map
    }
  }
  const province = stylist && stylist.province;
  if (!province) return "";
  try {
    const zone = vendorTimeZoneForProvince(province);
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longGeneric",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return (part && part.value) || "";
  } catch {
    return "";
  }
};

/**
 * Preferred entry point: use the IANA zone stored on the vendor record
 * (`stylist.timeZone`, derived from their signup geocode) and fall back to
 * the province map for rows without one. Mirrors the backend's precedence:
 * stored zone wins, province map covers the rest, app default last.
 */
export const vendorTimeZone = (stylist) => {
  const stored = stylist && stylist.timeZone;
  if (stored && typeof stored === "string") {
    try {
      // Validate: an unknown zone string would make Intl throw at read time.
      new Intl.DateTimeFormat("en-US", { timeZone: stored });
      return stored;
    } catch {
      // fall through to the province map
    }
  }
  return vendorTimeZoneForProvince(stylist && stylist.province);
};
