/**
 * Whether a professional is open right now, judged on their own clock.
 *
 * Two facts about the data decide the shape of this module:
 *
 *   1. Availability rows are bare wall-clock windows in the professional's zone
 *      ("Tuesday, 10:00 to 17:00"). Reading them against the visitor's browser
 *      clock is how a Toronto visitor sees a Calgary shop as shut while it is
 *      still trading, so `now` is always read through the professional's zone.
 *
 *   2. Availability may simply be missing from a payload. The search page gets
 *      it; the featured, saved and category lists do not. Missing is not the
 *      same as empty: an empty list means the professional has set no hours and
 *      is genuinely not open, while a missing one means this surface cannot say.
 *      Everything here reports that difference through `known`, so a card never
 *      claims "Closed" on the strength of a field the API never sent.
 *
 * This is the single implementation behind the "Open now" search filter and the
 * open state shown on cards and profiles. They used to be two: the filter
 * consulted the professional's clock and the badge consulted a login flag, so
 * the same professional could read "Online" at 3am and be filtered out of an
 * "Open now" search at the same moment.
 *
 * Presence is a different thing and is deliberately not computed here: whether
 * somebody is signed in says nothing about their hours, so callers that show it
 * show it separately and labelled as such.
 *
 * A time is stated only when the zone can be named, matching the copy guard in
 * `copyTimezone.test.js`: without a zone this returns the state with no clock
 * times at all rather than a bare "closes 5:00 PM".
 */

import { vendorTimeZone, vendorTimeZoneLabel } from "./vendorTimeZone";

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MINUTES_PER_DAY = 24 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "10:00" or "10:00:00" from the API, as minutes past midnight. */
export function parseClockMinutes(value) {
  const [hourText, minuteText] = String(value == null ? "" : value).split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 24 || minute < 0 || minute > 59) return null;
  return (hour % 24) * 60 + minute;
}

/** Minutes past midnight as a customer reads them: "5:00 PM". */
export function formatClockMinutes(minutes) {
  if (!Number.isFinite(minutes)) return "";
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

/** The professional's calendar at an instant: weekday, minutes, local date. */
function clockInZone(zone, instant) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const field = (type) => (parts.find((part) => part.type === type) || {}).value;
  const weekdayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[field("weekday")];
  const hour = Number(field("hour"));
  const minute = Number(field("minute"));
  if (weekdayIndex === undefined || !Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return {
    // Some engines report midnight as hour 24.
    minutes: (hour % 24) * 60 + minute,
    weekday: weekdayIndex,
    dateKey: `${field("year")}-${field("month")}-${field("day")}`,
  };
}

/** The windows a professional actually trades, invalid rows dropped. */
export function openWindows(availability) {
  if (!Array.isArray(availability)) return [];
  return availability
    .map((row) => {
      const weekday = Number(row && row.dayOfWeek);
      const start = parseClockMinutes(row && row.startTime);
      const end = parseClockMinutes(row && row.endTime);
      return { weekday, start, end };
    })
    .filter(
      (row) =>
        Number.isInteger(row.weekday) &&
        row.weekday >= 0 &&
        row.weekday <= 6 &&
        row.start !== null &&
        row.end !== null &&
        row.end > row.start
    );
}

const blockedOn = (stylist, dateKey) =>
  (Array.isArray(stylist && stylist.exceptions) ? stylist.exceptions : []).some(
    (exception) => exception && exception.blockedDate === dateKey
  );

/**
 * The next moment these hours open again, searching a week ahead.
 *
 * Days are stepped as 24-hour jumps and re-read in the professional's zone, so a
 * daylight-saving change between now and then cannot land the search on the
 * wrong weekday. The minutes are the vendor's written opening time, which is why
 * they are reported as written rather than converted.
 */
function nextOpening(stylist, windows, zone, now) {
  for (let offset = 0; offset <= 7; offset++) {
    const clock = clockInZone(zone, new Date(now.getTime() + offset * DAY_MS));
    if (!clock || blockedOn(stylist, clock.dateKey)) continue;
    const candidates = windows
      .filter((row) => row.weekday === clock.weekday)
      .filter((row) => (offset === 0 ? row.start > clock.minutes : true))
      .sort((a, b) => a.start - b.start);
    if (candidates.length === 0) continue;
    return {
      offset,
      minutes: candidates[0].start,
      weekday: clock.weekday,
      dateKey: clock.dateKey,
      label: offset === 0 ? "today" : offset === 1 ? "tomorrow" : WEEKDAY_NAMES[clock.weekday],
    };
  }
  return null;
}

/**
 * The open state for a professional.
 *
 * `known` false means the payload carried no availability, so nothing is claimed
 * and the caller falls back to whatever it can honestly show (usually presence).
 * When `known` is true, `open` is the answer on the professional's clock, and
 * `label`, `detail` and `hint` are ready to render: `detail` is the short second
 * half of a chip, `hint` the full sentence for a tooltip.
 */
export function vendorOpenState(stylist, { now = new Date() } = {}) {
  const zone = vendorTimeZone(stylist);
  const zoneLabel = vendorTimeZoneLabel(stylist);
  const availability = stylist && stylist.availability;

  if (!Array.isArray(availability)) {
    return { known: false, open: false, label: "", detail: "", hint: "", zone, zoneLabel };
  }

  const windows = openWindows(availability);
  const clock = clockInZone(zone, now);
  // An unreadable clock cannot be judged; reporting unknown beats a wrong answer.
  if (!clock) {
    return { known: false, open: false, label: "", detail: "", hint: "", zone, zoneLabel };
  }

  const blocked = blockedOn(stylist, clock.dateKey);
  const current = blocked
    ? null
    : windows.find((row) => row.weekday === clock.weekday && clock.minutes >= row.start && clock.minutes < row.end);
  const open = Boolean(current);

  // No zone name means no honest way to state a clock time, so none is stated.
  const time = (minutes) => (zoneLabel ? formatClockMinutes(minutes) : "");
  const withZone = (sentence) => (zoneLabel ? `${sentence} (${zoneLabel}).` : `${sentence}.`);

  if (open) {
    const closes = time(current.end);
    return {
      known: true,
      open: true,
      label: "Open now",
      detail: closes ? `Closes ${closes}` : "",
      hint: closes
        ? withZone(`Open now, closes ${closes}`)
        : "Open now, during their working hours.",
      zone,
      zoneLabel,
      closesAt: { minutes: current.end, text: closes },
      opensAt: null,
    };
  }

  const opening = nextOpening(stylist, windows, zone, now);
  if (!opening) {
    return {
      known: true,
      open: false,
      label: "Closed",
      detail: "No weekly hours set",
      hint: "This professional has not set working hours yet, so booking requests are confirmed by hand.",
      zone,
      zoneLabel,
      closesAt: null,
      opensAt: null,
    };
  }

  const opens = time(opening.minutes);
  const when = `${opening.label}${opens ? ` ${opens}` : ""}`;
  return {
    known: true,
    open: false,
    label: "Closed",
    detail: `Opens ${when}`,
    hint: withZone(`Closed now, opens ${when}`),
    zone,
    zoneLabel,
    closesAt: null,
    opensAt: opening,
  };
}

export default vendorOpenState;
