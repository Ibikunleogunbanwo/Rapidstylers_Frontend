import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchResults from "./searchResults";
import { APIService } from "../../hooks/remote/apiService";
import { vendorTimeZoneForProvince, vendorTimeZone, vendorTimeZoneLabel, vendorTimeZoneLabelStrict, zoneDisplayName, DEFAULT_VENDOR_ZONE } from "../../utils/vendorTimeZone";
// The shared site header needs the app's store; these tests are about the page body.
vi.mock("../../components/publicHeader", () => ({ default: () => null }));


// Pin the "browser" to Toronto so the visitor clock is guaranteed one hour
// ahead of any Alberta vendor. Node re-reads TZ per Date call, so tests below
// can construct wall-clock scenarios that differ between vendor and browser.
process.env.TZ = "America/Toronto";

vi.mock("../../components/serviceCard", () => ({
  default: ({ name, stylerId }) => <div data-testid="stylist-card">{name} · {stylerId}</div>,
}));
vi.mock("../../components/adSlot", () => ({ default: () => null }));
vi.mock("../../components/footer", () => ({ default: () => <footer data-testid="footer" /> }));
vi.mock("../../hooks/useSavedStylists", () => ({
  useSavedStylists: () => ({ savedIds: new Set(), loading: false, toggleSaved: vi.fn() }),
}));
vi.mock("../../hooks/remote/apiService", () => ({
  APIService: {
    getStylerType: vi.fn(),
    searchNearby: vi.fn(),
    searchByCity: vi.fn(),
  },
}));

describe("vendor time zones", () => {
  test("maps provinces to their dominant IANA zone", () => {
    expect(vendorTimeZoneForProvince("Alberta")).toBe("America/Edmonton");
    expect(vendorTimeZoneForProvince("Ontario")).toBe("America/Toronto");
    expect(vendorTimeZoneForProvince("British Columbia")).toBe("America/Vancouver");
    expect(vendorTimeZoneForProvince("Nova Scotia")).toBe("America/Halifax");
    expect(vendorTimeZoneForProvince("on")).toBe("America/Toronto");
    expect(vendorTimeZoneForProvince("  ALBERTA  ")).toBe("America/Edmonton");
  });

  test("unknown or missing provinces fall back to the app default", () => {
    expect(vendorTimeZoneForProvince(null)).toBe(DEFAULT_VENDOR_ZONE);
    expect(vendorTimeZoneForProvince("")).toBe(DEFAULT_VENDOR_ZONE);
    expect(vendorTimeZoneForProvince("Atlantis")).toBe(DEFAULT_VENDOR_ZONE);
  });

  test("the stored vendor zone wins over the province map", () => {
    expect(vendorTimeZone({ timeZone: "America/Toronto", province: "Alberta" })).toBe("America/Toronto");
    expect(vendorTimeZone({ timeZone: "America/Vancouver" })).toBe("America/Vancouver");
  });

  test("a stored zone the runtime cannot parse falls back to the province map", () => {
    expect(vendorTimeZone({ timeZone: "Not/ARealZone", province: "Alberta" })).toBe("America/Edmonton");
    expect(vendorTimeZone({ timeZone: "", province: "Ontario" })).toBe("America/Toronto");
    expect(vendorTimeZone(null)).toBe(DEFAULT_VENDOR_ZONE);
  });

  test("open-now filters on the vendor's clock even when the browser disagrees", () => {
    // Toronto runs hours ahead of Calgary (EDT vs MDT). Build the vendor a
    // window straddling Calgary's current clock ([now-10, now+40] Calgary):
    // OPEN by the vendor's clock. The Toronto-pinned browser clock reads
    // now+120 or more, past the window end, so a filter using the browser's
    // clock would hide the vendor. The verdict must be: shown.
    const calgary = vendorTimeZoneForProvince("Alberta");
    const nowCalgary = new Date(new Date().toLocaleString("en-US", { timeZone: calgary }));
    // Guard: the construction must not cross midnight in Calgary.
    if ((nowCalgary.getHours() === 0 && nowCalgary.getMinutes() < 10) ||
        (nowCalgary.getHours() === 23 && nowCalgary.getMinutes() >= 20)) {
      return; // scenario only constructible off-midnight; the mirror pins cover the rest
    }
    const plusMinutes = (base, delta) => {
      const d = new Date(base.getTime() + delta * 60000);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };
    const windowStart = plusMinutes(nowCalgary, -10);
    const windowEnd = plusMinutes(nowCalgary, 40);
    const weekday = String(nowCalgary.getDay());

    const stylist = {
      stylerId: "CALGARY1",
      businessName: "Calgary Cuts",
      province: "Alberta",
      exceptions: [],
      availability: [{ dayOfWeek: weekday, startTime: windowStart, endTime: windowEnd }],
    };

    APIService.searchNearby.mockResolvedValue({
      data: { data: { items: [stylist], total: 1, page: 1, pageSize: 12, hasNext: false } },
    });
    APIService.getStylerType.mockResolvedValue({ data: { data: [] } });

    render(
      <MemoryRouter initialEntries={["/search?openNow=true&lat=51.05&lng=-114.07"]}>
        <SearchResults />
      </MemoryRouter>
    );

    // The vendor is open by their own (Calgary) clock, so the card must render
    // even though the Toronto-pinned browser clock says the window passed.
    return new Promise((resolve) => setTimeout(resolve, 50)).then(() => {
      expect(screen.getByTestId("stylist-card")).toHaveTextContent("Calgary Cuts");
    });
  });
});

// Labels are whatever Intl calls the zone id in this runtime's tz/CLDR data, so
// the expectations ask Intl too instead of pinning "Mountain Time": Canada's 2026
// rule changes (BC, Alberta, NWT, Manitoba on permanent daylight time) can change
// a zone's name once a runtime ships newer data, and the site must follow it.
const named = (zone) => zoneDisplayName(zone);

describe("zoneDisplayName", () => {
  test("names a zone in plain language and nothing for an unknown id", () => {
    expect(named("America/Toronto")).toMatch(/\S/);
    expect(named("America/Toronto")).not.toMatch(/^[A-Z]{3,4}$/); // a name, not an abbreviation
    expect(named("America/Halifax")).not.toBe(named("America/Toronto"));
    expect(zoneDisplayName("Not/AZone")).toBe("");
  });
});

describe("vendorTimeZoneLabel", () => {
  test("names the stored zone in plain language", () => {
    expect(vendorTimeZoneLabel({ timeZone: "America/Toronto", province: "Ontario" })).toBe(named("America/Toronto"));
    expect(vendorTimeZoneLabel({ timeZone: "America/Edmonton", province: "Alberta" })).toBe(named("America/Edmonton"));
    expect(vendorTimeZoneLabel({ timeZone: "America/Vancouver", province: "British Columbia" })).toBe(named("America/Vancouver"));
    expect(named("America/Toronto")).toBeTruthy();
  });

  test("falls back to the province map when nothing is stored", () => {
    expect(vendorTimeZoneLabel({ province: "Nova Scotia" })).toBe(named("America/Halifax"));
    expect(vendorTimeZoneLabel({})).toBe(named("America/Edmonton")); // app default
  });

  test("degrades gracefully on impossible data instead of throwing", () => {
    // An unrecognizable stored zone falls through the province map to the app
    // default, so the label still says something true rather than blank.
    expect(vendorTimeZoneLabel({ timeZone: "Not/AZone" })).toBe(named("America/Edmonton"));
    expect(vendorTimeZoneLabel(null)).toBe(named("America/Edmonton")); // null stylist -> default zone
  });
});

describe("vendorTimeZoneLabelStrict (appointment surfaces)", () => {
  test("labels a stored zone and a province fallback", () => {
    expect(vendorTimeZoneLabelStrict({ timeZone: "America/Toronto", province: "Ontario" })).toBe("Eastern Time");
    expect(vendorTimeZoneLabelStrict({ province: "British Columbia" })).toBe("Pacific Time");
  });

  test("returns an empty string when nothing is known, instead of the app default", () => {
    // Unlike the booking pickers, a stored appointment with no zone data has
    // an unknown clock — printing "Mountain Time" could be wrong, so the
    // strict label renders bare.
    expect(vendorTimeZoneLabelStrict({})).toBe("");
    expect(vendorTimeZoneLabelStrict(null)).toBe("");
    expect(vendorTimeZoneLabelStrict({ timeZone: "Not/AZone" })).toBe("");
  });
});
