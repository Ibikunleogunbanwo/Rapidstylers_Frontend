import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CLOCK_TIME, scanDir, scanText } from "../../scripts/find-unzoned-times.mjs";
import { bookingConfirmationMessage } from "../components/selectService";
import { buildAppointmentEvent, icsFileText } from "./appointmentCalendar";

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const describeHit = (hit) => `${hit.file.replace(SRC + "/", "")}:${hit.line}  ${hit.text}`;

/**
 * The platform books at bare wall-clock times in the professional's zone, so
 * every appointment time a customer reads has to say whose clock it is on. This
 * is the time-zone twin of the em dash guard: a scan of the whole source tree
 * for copy that states an hour without naming a zone, plus a behavioural check
 * on the two functions that build that copy, because no scan can see a time that
 * is assembled from variables at runtime.
 *
 * The remaining customer-facing surface, the appointment rows on the dashboard,
 * is asserted where it renders: `pages/users/pages/dashboard.test.js` pins both
 * that a known zone is printed beside the time and that a row with no zone in
 * its payload degrades on its own. It is not duplicated here because that
 * decision is about the row, and this file is about the copy functions.
 */
describe("appointment copy", () => {
  it("never prints a hard-coded clock time without naming a zone", () => {
    // Test fixtures are not copy a customer reads, so they are out of scope.
    const { violations, staleExemptions } = scanDir(SRC, { includeTests: false });
    expect(violations.map(describeHit)).toEqual([]);
    // An exemption that stopped being needed is deleted, not left to rot: a
    // stale entry is how this list would quietly become a way to switch the
    // rule off.
    expect(staleExemptions).toEqual([]);
  });

  it("would still catch a bare time in new copy", () => {
    expect(scanText('const line = "Your appointment is at 4:00 pm.";')).toHaveLength(1);
    expect(scanText('toast("Booked for 9:30am, see you then");')).toHaveLength(1);
  });

  it("lets a time through when the line names the zone", () => {
    expect(scanText('const line = `Appointment at 4:00 pm (${zoneLabel})`;')).toEqual([]);
    expect(scanText('const line = "Booked for 4:00 pm Mountain Time";')).toEqual([]);
    expect(scanText('const iana = "4:00 pm America/Edmonton";')).toEqual([]);
  });

  it("ignores times in comments, which are not copy", () => {
    expect(scanText("// a customer in Toronto at 11:30pm sees a different day")).toEqual([]);
    expect(scanText("/* spanning 9:30pm and 12:30am,\n   which is the point */")).toEqual([]);
  });

  it("leaves the API's 24-hour values alone, since they are data rather than copy", () => {
    // Forty of these exist as the wire format for availability; flagging them
    // would bury the real hits in noise.
    expect(scanText('const wire = "09:00";')).toEqual([]);
    expect(scanText('const band = { startTime: "14:30", endTime: "15:30" };')).toEqual([]);
  });

  it("recognises a clock time the way a customer reads one", () => {
    expect(CLOCK_TIME.test("4:00 pm")).toBe(true);
    expect(CLOCK_TIME.test("12:30AM")).toBe(true);
    expect(CLOCK_TIME.test("24:00")).toBe(false);
  });
});

describe("the confirmation the customer is shown", () => {
  const TIME = "4:00 pm";

  it("names the zone whenever it states the hour", () => {
    const line = bookingConfirmationMessage("Tue, 19th", TIME, "Mountain Time");
    expect(line).toContain(TIME);
    expect(line).toContain("Mountain Time");
  });

  it("states no hour at all when the zone is unknown", () => {
    for (const zone of ["", null, undefined]) {
      const line = bookingConfirmationMessage("Tue, 19th", TIME, zone);
      expect(line).not.toMatch(CLOCK_TIME);
      // The day survives, so the customer still knows when to turn up.
      expect(line).toContain("Tue, 19th");
    }
  });

  it("falls back to the acknowledgement rather than inventing a slot", () => {
    expect(bookingConfirmationMessage("", "", "")).not.toMatch(CLOCK_TIME);
    expect(bookingConfirmationMessage()).not.toMatch(CLOCK_TIME);
  });
});

describe("the calendar entry", () => {
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

  it("names the zone in the body, since the hour it carries is an instant", () => {
    // Every calendar app renders the stamp in the customer's own zone, so the
    // only place the professional's clock can be legible is the description.
    expect(event.details).toContain("Mountain Time");
    expect(event.details).toContain("America/Edmonton");
  });

  it("carries that same statement into the file and the link", () => {
    expect(icsFileText(event)).toContain("Mountain Time");
  });

  it("names a zone even for a professional with none on record", () => {
    // The booking itself was interpreted in the zone the platform assumes, so
    // the entry names that zone rather than leaving the hour unexplained.
    const assumed = buildAppointmentEvent({
      appointmentDate: "2026-09-22",
      arrivalTime: "16:00",
      stylerTimeZone: null,
      stylerProvince: null,
    });
    expect(assumed.details).toMatch(/working hours are in/);
    expect(assumed.zone).toBeTruthy();
  });
});
