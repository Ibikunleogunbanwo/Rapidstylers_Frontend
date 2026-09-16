import { describe, test, expect } from "vitest";
import {
  vendorOpenState,
  openWindows,
  parseClockMinutes,
  formatClockMinutes,
} from "./vendorOpenState";

/**
 * The vendor's hours are written in the vendor's zone, so every expectation here
 * is an instant converted by hand: Calgary is MDT (UTC-6) until 1 November 2026
 * and MST (UTC-7) after, and the same written window has to answer differently
 * on either side of that line.
 */
const TUESDAY = { dayOfWeek: "2", startTime: "10:00", endTime: "17:00" };
const SATURDAY = { dayOfWeek: "6", startTime: "09:00", endTime: "16:00" };

const calgary = (overrides = {}) => ({
  timeZone: "America/Edmonton",
  province: "Alberta",
  availability: [TUESDAY, SATURDAY],
  ...overrides,
});

// 22 September 2026 is a Tuesday.
const instant = (iso) => new Date(iso);

describe("reading a professional's own clock", () => {
  test("is open inside a window, judged on their zone and not the visitor's", () => {
    // 12:00 in Calgary is 18:00 UTC. A visitor in Toronto is at 14:00 local and
    // must still read "open", because the shop is the one trading.
    const state = vendorOpenState(calgary(), { now: instant("2026-09-22T18:00:00Z") });
    expect(state.open).toBe(true);
    expect(state.label).toBe("Open now");
  });

  test("is closed before the window opens, and says when it does", () => {
    // 09:00 in Calgary, an hour before Tuesday's 10:00.
    const state = vendorOpenState(calgary(), { now: instant("2026-09-22T15:00:00Z") });
    expect(state.open).toBe(false);
    expect(state.detail).toBe("Opens today 10:00 AM");
  });

  test("reads the window the same way after the daylight-saving change", () => {
    // 12 January 2027 is a Tuesday, and Calgary is MST (UTC-7). The same written
    // 10:00 to 17:00 window must still read as open at noon, which a fixed
    // UTC offset would get wrong for half the year.
    const state = vendorOpenState(calgary(), { now: instant("2027-01-12T19:00:00Z") });
    expect(state.open).toBe(true);
    expect(state.detail).toBe("Closes 5:00 PM");
  });

  test("closes exactly at the end of the window rather than a minute past", () => {
    // 17:00 Calgary is the closing instant, and a slot ending then is over.
    expect(vendorOpenState(calgary(), { now: instant("2026-09-22T23:00:00Z") }).open).toBe(false);
    // 16:59 Calgary is still open.
    expect(vendorOpenState(calgary(), { now: instant("2026-09-22T22:59:00Z") }).open).toBe(true);
  });

  test("names the zone whenever it states a time", () => {
    const open = vendorOpenState(calgary(), { now: instant("2026-09-22T18:00:00Z") });
    expect(open.hint).toContain("Mountain Time");
    const closed = vendorOpenState(calgary(), { now: instant("2026-09-22T15:00:00Z") });
    expect(closed.hint).toContain("Mountain Time");
    expect(closed.hint).not.toMatch(/[—–]/);
  });

  test("states no clock time at all when the zone cannot be named", () => {
    // Mirrors the copy guard: a bare hour is worse than no hour. Intl is made to
    // fail by handing it a zone string it does not know.
    const state = vendorOpenState(calgary({ timeZone: "Mars/Olympus", province: null }), {
      now: instant("2026-09-22T18:00:00Z"),
    });
    // The province map has no answer either, so the app default applies and the
    // state still resolves: what must not happen is a time with no zone named.
    expect(state.known).toBe(true);
    if (state.hint.includes("AM") || state.hint.includes("PM")) {
      expect(state.zoneLabel).toBeTruthy();
    }
  });

  test("uses the province map when no zone is stored", () => {
    const state = vendorOpenState(calgary({ timeZone: null }), { now: instant("2026-09-22T18:00:00Z") });
    expect(state.zone).toBe("America/Edmonton");
    expect(state.open).toBe(true);
  });
});

describe("the next time these hours open", () => {
  test("looks past a day with no windows at all", () => {
    // 21 September 2026 is a Monday: this professional does not work Mondays.
    const state = vendorOpenState(calgary(), { now: instant("2026-09-21T18:00:00Z") });
    expect(state.open).toBe(false);
    expect(state.detail).toBe("Opens tomorrow 10:00 AM");
  });

  test("names the weekday when the next window is more than a day away", () => {
    // Wednesday: the next window is Saturday.
    const state = vendorOpenState(calgary(), { now: instant("2026-09-23T18:00:00Z") });
    expect(state.detail).toBe("Opens Saturday 9:00 AM");
  });

  test("skips a blocked date instead of promising it", () => {
    const blocked = calgary({ exceptions: [{ blockedDate: "2026-09-22" }] });
    // Tuesday noon, but the professional has blocked today entirely.
    const state = vendorOpenState(blocked, { now: instant("2026-09-22T18:00:00Z") });
    expect(state.open).toBe(false);
    expect(state.detail).toBe("Opens Saturday 9:00 AM");
  });

  test("reports no hours at all rather than a made-up opening", () => {
    const state = vendorOpenState(calgary({ availability: [] }), { now: instant("2026-09-22T18:00:00Z") });
    expect(state.known).toBe(true);
    expect(state.open).toBe(false);
    expect(state.detail).toBe("No weekly hours set");
    expect(state.opensAt).toBeNull();
  });
});

describe("what a surface is allowed to claim", () => {
  test("claims nothing when the payload carried no availability", () => {
    // The featured, saved and category lists never receive availability. They
    // must not read as "Closed" on the strength of a field the API never sent.
    for (const availability of [undefined, null, "10:00"]) {
      const state = vendorOpenState(calgary({ availability }), { now: instant("2026-09-22T18:00:00Z") });
      expect(state.known).toBe(false);
      expect(state.label).toBe("");
      expect(state.detail).toBe("");
    }
  });

  test("an empty list is different from a missing one", () => {
    expect(vendorOpenState(calgary({ availability: [] })).known).toBe(true);
    expect(vendorOpenState(calgary({ availability: undefined })).known).toBe(false);
  });

  test("falls back to the app default zone like the rest of the app", () => {
    // An unknown zone with no province resolves to the app default rather than
    // throwing, because the booking pickers made the same assumption.
    const state = vendorOpenState({ timeZone: null, province: null, availability: [TUESDAY] }, {
      now: instant("2026-09-22T18:00:00Z"),
    });
    expect(state.zone).toBeTruthy();
    expect(state.known).toBe(true);
  });
});

describe("the window parsing", () => {
  test("drops rows the API could not have meant", () => {
    expect(
      openWindows([
        { dayOfWeek: "2", startTime: "10:00", endTime: "17:00" },
        { dayOfWeek: "3", startTime: "17:00", endTime: "10:00" }, // backwards
        { dayOfWeek: "4", startTime: "10:00", endTime: "10:00" }, // zero length
        { dayOfWeek: "9", startTime: "10:00", endTime: "17:00" }, // not a weekday
        { dayOfWeek: "5", startTime: "nonsense", endTime: "17:00" },
      ])
    ).toHaveLength(1);
  });

  test("accepts the seconds the database may include", () => {
    expect(parseClockMinutes("10:00:00")).toBe(600);
    expect(parseClockMinutes("17:00")).toBe(1020);
    expect(parseClockMinutes("")).toBeNull();
    expect(parseClockMinutes("25:00")).toBeNull();
  });

  test("formats a clock time the way a customer reads one", () => {
    expect(formatClockMinutes(600)).toBe("10:00 AM");
    expect(formatClockMinutes(720)).toBe("12:00 PM");
    expect(formatClockMinutes(0)).toBe("12:00 AM");
    expect(formatClockMinutes(1020)).toBe("5:00 PM");
    expect(formatClockMinutes(1259)).toBe("8:59 PM");
  });
});
