/**
 * Turning a booking into something a customer can put in their own calendar.
 *
 * The hard part is not the file format, it is the hour. A booking is stored as
 * bare wall-clock values in the professional's zone: the stylist's 10:00 in
 * Calgary is not a Toronto customer's 10:00, and a customer who adds the
 * appointment to their phone must see the hour *they* have to turn up, which is
 * a different number than the one on the booking.
 *
 * So nothing here writes a local time into a calendar. The wall time is
 * converted to an absolute instant first, and the calendar entry is emitted in
 * UTC. An instant means the same moment to everyone, so every calendar app
 * renders it in whatever zone the customer actually lives in, and a booking
 * made across a time zone lands at the right hour without either side having to
 * do arithmetic. The stylist's zone is still named in the event body, because
 * the *appointment* is on the stylist's clock even when the reminder is on the
 * customer's.
 *
 * Why UTC and not a TZID: `DTSTART;TZID=America/Edmonton:...` is only valid in
 * RFC 5545 when the file also carries a matching VTIMEZONE component, and a
 * TZID without one is either rejected or silently read as a different zone by
 * some clients. Shipping a whole VTIMEZONE block to express a single instant
 * buys nothing here, and getting it subtly wrong moves the appointment by an
 * hour. The instant is exact and needs no timezone database on the client.
 *
 * Daylight saving takes care of itself for the same reason, which is why the
 * conversion below resolves the zone's offset *at the booking's own date*
 * rather than at today's: an Edmonton booking is -6 in July and -7 in January,
 * and hard-coding either would shift half the year's appointments.
 */

import { vendorTimeZone } from "./vendorTimeZone";

/** ICS lines are CRLF-terminated, and it is the only line break RFC 5545 allows. */
const CRLF = "\r\n";

const pad = (value) => String(value).padStart(2, "0");

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})/;
// Canonical wire format is 24-hour HH:mm; the modal holds 12-hour labels, so
// both are accepted rather than assuming one caller.
const ANY_TIME = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i;

/**
 * Whether Intl recognises a zone id. An unknown string makes Intl throw at read
 * time, so it is checked once here instead of being trusted.
 */
function isKnownZone(timeZone) {
  if (!timeZone || typeof timeZone !== "string") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** The zone's offset from UTC in minutes at a given instant (negative west). */
function zoneOffsetMinutes(timeZone, instantMs) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instantMs));
  const field = (type) => Number((parts.find((part) => part.type === type) || {}).value);
  // Some engines report a midnight hour as "24"; the day is already correct.
  const wallMs = Date.UTC(
    field("year"),
    field("month") - 1,
    field("day"),
    field("hour") % 24,
    field("minute"),
    field("second")
  );
  return Math.round((wallMs - instantMs) / 60000);
}

const parseDay = (value) => {
  const match = DATE_ONLY.exec(String(value || "").trim());
  if (!match) return null;
  const day = { year: Number(match[1]), month: Number(match[2]), date: Number(match[3]) };
  if (day.month < 1 || day.month > 12 || day.date < 1 || day.date > 31) return null;
  return day;
};

const parseClock = (value) => {
  const match = ANY_TIME.exec(String(value || "").trim());
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = (match[3] || "").toLowerCase();
  if (minute > 59 || hour > 23) return null;
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return { hour, minute };
};

/**
 * The absolute instant of a wall-clock time in a zone.
 *
 * There is no direct API for this, so the wall time is first read as if it were
 * UTC and then corrected by the zone's offset. The second pass exists because
 * the first reading can land on the other side of a daylight-saving change: the
 * offset is re-read at the corrected instant and applied again, which settles on
 * the right answer either side of a transition. Returns null for anything
 * unreadable, so a caller can offer no calendar action rather than a wrong hour.
 */
export function zonedWallTimeToInstant(dateStr, timeStr, timeZone) {
  const day = parseDay(dateStr);
  const clock = parseClock(timeStr);
  if (!day || !clock) return null;
  if (!isKnownZone(timeZone)) return null;

  const wallMs = Date.UTC(day.year, day.month - 1, day.date, clock.hour, clock.minute);
  const guess = wallMs - zoneOffsetMinutes(timeZone, wallMs) * 60000;
  return new Date(wallMs - zoneOffsetMinutes(timeZone, guess) * 60000);
}

/** The zone's friendly name ("Mountain Time"), or "" when Intl cannot name it. */
function zoneName(timeZone) {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longGeneric" })
      .formatToParts(new Date())
      .find((entry) => entry.type === "timeZoneName");
    return (part && part.value) || "";
  } catch {
    return "";
  }
}

/** RFC 5545 text values escape backslash, semicolon, comma and line breaks. */
export function escapeIcsText(value) {
  return String(value == null ? "" : value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** A UTC timestamp in ICS form: 20260922T160000Z. */
export function icsStamp(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

const trimmed = (value) => String(value == null ? "" : value).trim();

/**
 * The calendar entry for a booking, or null when it cannot be stated honestly.
 *
 * `location` is passed in rather than derived, because it differs by service:
 * for a visit the customer travels to the professional's address, while for a
 * home visit the professional travels to the customer and the booking modal has
 * no address for them. A missing location is left out rather than filled with a
 * guess that would send someone to the wrong door.
 */
export function buildAppointmentEvent({
  appointmentDate,
  arrivalTime,
  durationMinutes,
  serviceName,
  stylistName,
  stylerId,
  stylerTimeZone,
  stylerProvince,
  location,
  bookingId,
} = {}) {
  const zone = vendorTimeZone({ timeZone: stylerTimeZone, province: stylerProvince });
  const start = zonedWallTimeToInstant(appointmentDate, arrivalTime, zone);
  if (!start) return null;

  const minutes = Number(durationMinutes);
  const duration = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 60;
  const end = new Date(start.getTime() + duration * 60000);

  const service = trimmed(serviceName);
  const stylist = trimmed(stylistName);
  const where = trimmed(location);
  const zoneLabel = zoneName(zone);

  const title = service && stylist
    ? `${service} with ${stylist}`
    : service || (stylist ? `Appointment with ${stylist}` : "Beauty appointment");

  const details = [
    `Booking request for ${duration} minutes${stylist ? ` with ${stylist}` : ""}.`,
    `${stylist || "The professional"} confirms it shortly, and it can be cancelled from your bookings.`,
    // The hour below is an instant, so the customer's calendar shows it in their
    // own zone. Naming the professional's zone keeps the two clocks legible.
    zoneLabel
      ? `The professional's working hours are in ${zoneLabel} (${zone}).`
      : `The professional's working hours are in ${zone}.`,
    where
      ? `You are booked at ${where}.`
      : "The professional travels to your address for this appointment.",
  ].join("\n");

  // Stable for the same booking, so adding it twice updates one entry rather
  // than filling the customer's calendar with duplicates.
  const reference = trimmed(bookingId) || `${trimmed(stylerId)}-${appointmentDate}-${trimmed(arrivalTime)}`;
  const uid = `${reference || "booking"}@rapidstylers.ca`;

  return {
    uid,
    zone,
    zoneLabel,
    title,
    details,
    location: where,
    start,
    end,
    durationMinutes: duration,
    // The day the appointment falls on for the professional, which is what the
    // customer's calendar file is named after. The date parsed above, so there
    // is nothing to fall back to.
    localDate: String(appointmentDate).trim().slice(0, 10),
  };
}

/** A Google Calendar "add event" link for the entry. */
export function googleCalendarUrl(event) {
  if (!event || !event.start || !event.end) return "";
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", event.title);
  params.set("dates", `${icsStamp(event.start)}/${icsStamp(event.end)}`);
  params.set("details", event.details);
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** The file body, ICA-complete for a single event. */
export function icsFileText(event, { now = new Date() } = {}) {
  if (!event || !event.start || !event.end) return "";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RapidStylers//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.uid)}`,
    `DTSTAMP:${icsStamp(now)}`,
    `DTSTART:${icsStamp(event.start)}`,
    `DTEND:${icsStamp(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.details)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join(CRLF) + CRLF;
}

/** The downloaded file's name, dated by the day the appointment falls on. */
export function icsFileName(event) {
  const day = (event && event.localDate) || "";
  return day ? `rapidstylers-booking-${day}.ics` : "rapidstylers-booking.ics";
}

/**
 * Hands the file to the browser. Returns false where the environment cannot do
 * it (tests, or a browser without object URLs) so the caller can keep the
 * Google Calendar link as the action that always works.
 */
export function downloadIcs(event, { now = new Date() } = {}) {
  const body = icsFileText(event, { now });
  if (!body) return false;
  if (typeof document === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) {
    return false;
  }
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = icsFileName(event);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // The object URL can be released once the click has been dispatched.
  setTimeout(() => URL.revokeObjectURL(href), 0);
  return true;
}
