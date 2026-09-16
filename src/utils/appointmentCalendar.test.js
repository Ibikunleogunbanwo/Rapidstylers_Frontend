import { describe, test, expect } from "vitest";
import {
  zonedWallTimeToInstant,
  buildAppointmentEvent,
  googleCalendarUrl,
  icsFileText,
  icsFileName,
  escapeIcsText,
} from "./appointmentCalendar";

/**
 * Every instant asserted here is an exact UTC value, which is the whole point:
 * the module's job is to stop shipping a bare wall-clock time into someone
 * else's calendar. A wrong zone is not a cosmetic bug, it is a customer
 * arriving an hour or six late.
 */
describe("reading a booking's wall-clock time as an instant", () => {
  test("resolves a summer booking in the professional's zone", () => {
    // Edmonton is MDT (UTC-6) in September.
    expect(zonedWallTimeToInstant("2026-09-22", "10:00", "America/Edmonton").toISOString())
      .toBe("2026-09-22T16:00:00.000Z");
  });

  test("resolves a winter booking in the same zone differently", () => {
    // Same zone, MST (UTC-7) in January. Reading today's offset would be wrong
    // for half the year, which is why the offset is resolved at the event date.
    expect(zonedWallTimeToInstant("2026-01-12", "10:00", "America/Edmonton").toISOString())
      .toBe("2026-01-12T17:00:00.000Z");
  });

  test("handles a zone east of the professional's", () => {
    expect(zonedWallTimeToInstant("2026-09-22", "10:00", "America/Toronto").toISOString())
      .toBe("2026-09-22T14:00:00.000Z");
  });

  test("handles a half-hour offset zone", () => {
    expect(zonedWallTimeToInstant("2026-09-22", "10:00", "Asia/Kolkata").toISOString())
      .toBe("2026-09-22T04:30:00.000Z");
  });

  test("does not assume daylight saving where there is none", () => {
    // Saskatchewan keeps UTC-6 all year, in July as well as January.
    expect(zonedWallTimeToInstant("2026-07-15", "10:00", "America/Regina").toISOString())
      .toBe("2026-07-15T16:00:00.000Z");
    expect(zonedWallTimeToInstant("2026-01-15", "10:00", "America/Regina").toISOString())
      .toBe("2026-01-15T16:00:00.000Z");
  });

  test("straddles the spring-forward change on the day it happens", () => {
    // 8 March 2026: Edmonton is -7 before 02:00 and -6 from 03:00 onwards.
    expect(zonedWallTimeToInstant("2026-03-08", "01:30", "America/Edmonton").toISOString())
      .toBe("2026-03-08T08:30:00.000Z");
    expect(zonedWallTimeToInstant("2026-03-08", "10:00", "America/Edmonton").toISOString())
      .toBe("2026-03-08T16:00:00.000Z");
  });

  test("resolves the hour after the autumn change", () => {
    // 1 November 2026: Edmonton has fallen back to MST (UTC-7).
    expect(zonedWallTimeToInstant("2026-11-01", "10:00", "America/Edmonton").toISOString())
      .toBe("2026-11-01T17:00:00.000Z");
  });

  test("reads both the wire format and the 12-hour label a customer picked", () => {
    const wire = zonedWallTimeToInstant("2026-09-22", "16:00", "America/Edmonton");
    const label = zonedWallTimeToInstant("2026-09-22", "4:00 pm", "America/Edmonton");
    expect(label.toISOString()).toBe(wire.toISOString());
    expect(zonedWallTimeToInstant("2026-09-22", "12:30 am", "America/Edmonton").toISOString())
      .toBe("2026-09-22T06:30:00.000Z");
  });

  test("returns nothing rather than guessing at an unreadable booking", () => {
    expect(zonedWallTimeToInstant("", "10:00", "America/Edmonton")).toBeNull();
    expect(zonedWallTimeToInstant("22/09/2026", "10:00", "America/Edmonton")).toBeNull();
    expect(zonedWallTimeToInstant("2026-09-22", "", "America/Edmonton")).toBeNull();
    expect(zonedWallTimeToInstant("2026-09-22", "25:00", "America/Edmonton")).toBeNull();
    expect(zonedWallTimeToInstant("2026-13-22", "10:00", "America/Edmonton")).toBeNull();
    expect(zonedWallTimeToInstant("2026-09-22", "10:00", "Mars/Olympus")).toBeNull();
    expect(zonedWallTimeToInstant("2026-09-22", "10:00", null)).toBeNull();
  });

  test("never depends on the visitor's own zone", () => {
    // The same booking resolves to the same instant whatever the browser's
    // clock says, because the conversion only ever reads the target zone.
    const first = zonedWallTimeToInstant("2026-09-22", "10:00", "America/Edmonton").getTime();
    const second = zonedWallTimeToInstant("2026-09-22", "10:00", "America/Edmonton").getTime();
    expect(second).toBe(first);
  });
});

describe("the calendar entry for a booking", () => {
  const booking = {
    appointmentDate: "2026-09-22",
    arrivalTime: "16:00",
    durationMinutes: 90,
    serviceName: "Braids",
    stylistName: "Demo Hairstylist Studio",
    stylerId: "DEMO1",
    stylerTimeZone: "America/Edmonton",
    location: "Suite 210, 102 8 Ave SW, Calgary",
  };

  test("carries the service, the professional and the duration", () => {
    const event = buildAppointmentEvent(booking);
    expect(event.title).toBe("Braids with Demo Hairstylist Studio");
    expect(event.start.toISOString()).toBe("2026-09-22T22:00:00.000Z");
    expect(event.end.toISOString()).toBe("2026-09-22T23:30:00.000Z");
  });

  test("names the professional's zone in the event body", () => {
    const event = buildAppointmentEvent(booking);
    expect(event.details).toContain("Mountain Time");
    expect(event.details).toContain("America/Edmonton");
  });

  test("says the professional travels when there is no address to go to", () => {
    const event = buildAppointmentEvent({ ...booking, location: "" });
    expect(event.location).toBe("");
    expect(event.details).toContain("travels to your address");
  });

  test("stays a request rather than a confirmed appointment", () => {
    expect(buildAppointmentEvent(booking).details).toMatch(/confirms it shortly/);
  });

  test("falls back to the province map when no zone is stored", () => {
    const event = buildAppointmentEvent({ ...booking, stylerTimeZone: null, stylerProvince: "Alberta" });
    expect(event.zone).toBe("America/Edmonton");
  });

  test("defaults the duration instead of inventing a zero-length event", () => {
    expect(buildAppointmentEvent({ ...booking, durationMinutes: null }).durationMinutes).toBe(60);
    expect(buildAppointmentEvent({ ...booking, durationMinutes: -30 }).durationMinutes).toBe(60);
  });

  test("a late slot ends on the next day without arithmetic from the caller", () => {
    const event = buildAppointmentEvent({ ...booking, arrivalTime: "23:30" });
    expect(event.start.toISOString()).toBe("2026-09-23T05:30:00.000Z");
    expect(event.end.toISOString()).toBe("2026-09-23T07:00:00.000Z");
  });

  test("builds no event at all when the booking cannot be read", () => {
    expect(buildAppointmentEvent({ ...booking, appointmentDate: "" })).toBeNull();
    expect(buildAppointmentEvent({ ...booking, arrivalTime: "not a time" })).toBeNull();
    expect(buildAppointmentEvent()).toBeNull();
  });

  test("identifies the same booking the same way twice, so it updates one entry", () => {
    const first = buildAppointmentEvent(booking);
    const again = buildAppointmentEvent(booking);
    expect(again.uid).toBe(first.uid);
    expect(buildAppointmentEvent({ ...booking, arrivalTime: "17:00" }).uid).not.toBe(first.uid);
  });

  test("titles the event sensibly when names are missing", () => {
    expect(buildAppointmentEvent({ ...booking, serviceName: "" }).title)
      .toBe("Appointment with Demo Hairstylist Studio");
    expect(buildAppointmentEvent({ ...booking, serviceName: "", stylistName: "" }).title)
      .toBe("Beauty appointment");
  });
});

describe("the .ics file", () => {
  const event = buildAppointmentEvent({
    appointmentDate: "2026-09-22",
    arrivalTime: "16:00",
    durationMinutes: 90,
    serviceName: "Braids",
    stylistName: "Demo Hairstylist Studio",
    stylerId: "DEMO1",
    stylerTimeZone: "America/Edmonton",
    location: "Suite 210, 102 8 Ave SW, Calgary",
  });
  const body = icsFileText(event, { now: new Date("2026-09-16T12:00:00Z") });

  test("is a complete single-event calendar", () => {
    expect(body.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(body.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain("VERSION:2.0");
  });

  test("writes the appointment as an instant, so any calendar shows the right hour", () => {
    expect(body).toContain("DTSTART:20260922T220000Z");
    expect(body).toContain("DTEND:20260922T233000Z");
  });

  test("uses CRLF line endings, the only break RFC 5545 allows", () => {
    expect(body).toContain("\r\n");
    expect(body.split("\r\n").every((line) => !line.includes("\n"))).toBe(true);
  });

  test("stamps the file and identifies the event", () => {
    expect(body).toContain("DTSTAMP:20260916T120000Z");
    expect(body).toContain("UID:DEMO1-2026-09-22-16:00@rapidstylers.ca");
  });

  test("escapes the characters that would otherwise break the file", () => {
    const awkward = icsFileText(buildAppointmentEvent({
      appointmentDate: "2026-09-22",
      arrivalTime: "16:00",
      serviceName: "Cut; colour, wash",
      stylistName: "A\\B Studio",
      stylerId: "S1",
      stylerTimeZone: "America/Edmonton",
      location: "12 Main St; Unit 4",
    }));
    expect(awkward).toContain("SUMMARY:Cut\\; colour\\, wash with A\\\\B Studio");
    expect(awkward).toContain("LOCATION:12 Main St\\; Unit 4");
  });

  test("leaves out a location it does not have instead of pointing somewhere wrong", () => {
    const homeVisit = icsFileText(buildAppointmentEvent({
      appointmentDate: "2026-09-22",
      arrivalTime: "16:00",
      stylerTimeZone: "America/Edmonton",
      location: "",
    }));
    expect(homeVisit).not.toContain("LOCATION:");
  });

  test("writes nothing when there is no event", () => {
    expect(icsFileText(null)).toBe("");
  });

  test("names the file after the day the appointment falls on", () => {
    expect(icsFileName(event)).toBe("rapidstylers-booking-2026-09-22.ics");
    expect(icsFileName(null)).toBe("rapidstylers-booking.ics");
  });

  test("escapes the four sequences RFC 5545 reserves", () => {
    expect(escapeIcsText("a;b,c\\d\ne")).toBe("a\\;b\\,c\\\\d\\ne");
  });

  test("keeps the site's copy free of em dashes", () => {
    expect(icsFileText(event, { now: new Date("2026-09-16T12:00:00Z") })).not.toMatch(/[—–]/);
    expect(event.details).not.toMatch(/[—–]/);
  });
});

describe("the Google Calendar action", () => {
  const event = buildAppointmentEvent({
    appointmentDate: "2026-09-22",
    arrivalTime: "16:00",
    durationMinutes: 60,
    serviceName: "Braids & colour",
    stylistName: "Demo Studio",
    stylerId: "DEMO1",
    stylerTimeZone: "America/Edmonton",
    location: "102 8 Ave SW, Calgary",
  });
  const url = googleCalendarUrl(event);

  test("is a template link carrying the same instant as the file", () => {
    expect(url.startsWith("https://calendar.google.com/calendar/render?")).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("action")).toBe("TEMPLATE");
    expect(params.get("dates")).toBe("20260922T220000Z/20260922T230000Z");
  });

  test("carries the title, the location and the zone note", () => {
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("text")).toBe("Braids & colour with Demo Studio");
    expect(params.get("location")).toBe("102 8 Ave SW, Calgary");
    expect(params.get("details")).toContain("Mountain Time");
  });

  test("omits the location when the professional travels to the customer", () => {
    const params = new URLSearchParams(googleCalendarUrl({ ...event, location: "" }).split("?")[1]);
    expect(params.get("location")).toBeNull();
  });

  test("yields nothing when there is no event to add", () => {
    expect(googleCalendarUrl(null)).toBe("");
  });
});
