import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SelectService, { bookingConfirmationMessage } from "./selectService";
// Pin the "browser" clock zone so the stylist-calendar tests below can
// construct a guaranteed midnight-boundary divergence (Toronto visitor,
// Alberta stylist). Must run before any Date is created in this file.
process.env.TZ = "America/Toronto";
// Resolves to the vi.mock() below (hoisted), so APIService is the mock.
import { APIService } from "../hooks/remote/apiService";
import { getBookingIntent, setBookingIntent, getAuthToken, showSuccessToastMessage } from "../utils/constant";

// react-scripts resets mock implementations between tests, so the factory only
// creates the fns and beforeEach wires the resolved values — the same pattern
// the existing apiService.test.js uses.
vi.mock("../hooks/remote/apiService", () => ({
  APIService: {
    singleStylerData: vi.fn(),
    estimateBooking: vi.fn(),
    bookAppointment: vi.fn(),
  },
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("react-redux", () => {
  const dispatch = vi.fn(() => ({ payload: { statusCode: "200" } }));
  return { useDispatch: () => dispatch, __testDispatch: dispatch };
});
vi.mock("../hooks/local/userReducer", () => ({
  verifySignUpEmailAddress: vi.fn(),
  verifyOtpCode: vi.fn(),
  createUserAccount: vi.fn(),
  userAuthenticate: vi.fn(),
}));
// The customer's position decides both the home-service fee and the visit
// card's distance, so each test can install the one it means to exercise.
const locationMock = vi.hoisted(() => ({
  current: { latitude: null, longitude: null, source: "gps" },
}));
vi.mock("../context/LocationContext", () => ({
  useUserLocation: () => ({ location: locationMock.current }),
}));
vi.mock("../utils/constant", () => ({
  // Vitest (unlike Jest's CJS interop) throws on a named export the mock does
  // not define, so every constant selectService.js imports must be listed here.
  STRIPE_PUBLISHABLE_KEY: "",
  getAuthToken: vi.fn(() => null),
  getRefreshToken: () => null,
  setAuthToken: vi.fn(),
  setRefreshToken: vi.fn(),
  clearAuthToken: vi.fn(),
  clearRefreshToken: vi.fn(),
  retrieveFromLocalStorage: () => ({}),
  showErrorToastMessage: vi.fn(),
  showSuccessToastMessage: vi.fn(),
  // Booking-intent persistence (signed-out visitors).
  getBookingIntent: vi.fn(() => null),
  setBookingIntent: vi.fn(),
  clearBookingIntent: vi.fn(),
}));

beforeEach(() => {
  APIService.singleStylerData.mockResolvedValue({
    data: { data: { availability: [], bookedSlots: [], exceptions: [] } },
  });
  APIService.estimateBooking.mockResolvedValue({ data: { data: null } });
});

const renderOpen = () => {
  render(
    <SelectService
      serviceName="Haircut"
      servicePrice="60"
      stylerId="s1"
      subServiceId="ss1"
    />
  );
  fireEvent.click(screen.getByText("Book service"));
  return document.querySelector("div.fixed");
};

describe("SelectService booking modal viewport containment", () => {
  test("opens with the overlay anchored by explicit offsets and above app content", () => {
    const overlay = renderOpen();
    expect(overlay).not.toBeNull();

    // Explicit top/bottom/left/right pin the overlay to the viewport; without
    // them a fixed element falls back to its static flow position.
    expect(overlay.className).toContain("top-0");
    expect(overlay.className).toContain("bottom-0");
    expect(overlay.className).toContain("left-0");
    expect(overlay.className).toContain("right-0");
    // The overlay must paint above page content, not underneath it.
    expect(overlay.className).toContain("z-50");
    // It must actually be visible once opened.
    expect(overlay.className).toContain("block");
    expect(overlay.className).not.toContain("hidden");
  });

  test("keeps the dialog width and height inside the viewport", () => {
    const overlay = renderOpen();
    const card = overlay.querySelector(".bg-white.relative");
    expect(card).toBeInTheDocument();

    // Width: w-full on mobile inside the px-4 padded overlay, so the right
    // edge can never exceed the viewport.
    expect(card.className).toContain("w-full");
    // Height: capped at 60% of the viewport with internal scrolling so a
    // long booking form can never push the card off-screen.
    expect(card.className).toContain("max-h-[60%]");
    expect(card.className).toContain("overflow-y-scroll");
  });

  test("closes by removing the overlay from view", () => {
    renderOpen();
    expect(document.querySelector("div.fixed").className).toContain("block");

    // The close icon sits in the sticky header of the booking dialog.
    fireEvent.click(document.querySelector("img[alt='']"));
    expect(document.querySelector("div.fixed").className).toContain("hidden");
  });
});

describe("Booking intent deep-linking for signed-out visitors", () => {
  beforeEach(() => {
    getBookingIntent.mockReturnValue(null);
  });

  const renderOpen = () => {
    render(
      <SelectService
        serviceName="Braids"
        servicePrice="80"
        stylerId="s1"
        subServiceId="ss1"
      />
    );
    fireEvent.click(screen.getByText("Book service"));
    return document.querySelector("div.fixed");
  };

  test("persists the picked slot to sessionStorage once a date and time are chosen", () => {
    renderOpen();

    // Pick a day and a time; both are needed before the intent is written.
    fireEvent.click(screen.getByText("4:00 pm"));
    expect(setBookingIntent).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByText(/15/)[0]);
    expect(setBookingIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        stylerId: "s1",
        subServiceId: "ss1",
        serviceName: "Braids",
        time: "4:00 pm",
      })
    );
  });

  test("restores the exact month, day and time from a stored intent on reopen", () => {
    getBookingIntent.mockReturnValue({
      stylerId: "s1",
      subServiceId: "ss1",
      serviceName: "Braids",
      month: "October",
      day: 9,
      time: "10:30 am",
      serviceType: "homeService",
    });

    renderOpen();

    // The restored selection is visible: October selected, 10:30 am and home
    // service both rendered as the active (brand-colored) choice.
    expect(document.querySelector("select").value).toBe("October");
    const activeTime = [...document.querySelectorAll("div")].find(
      (el) => el.className.includes("bg-brand") && el.textContent.trim() === "10:30 am"
    );
    expect(activeTime, "the picked time must be re-highlighted on reopen").toBeTruthy();
    const activeType = [...document.querySelectorAll("div")].find(
      (el) => el.className.includes("bg-brand") && el.textContent.trim() === "Home service"
    );
    expect(activeType, "the picked service type must be re-highlighted on reopen").toBeTruthy();
  });

  test("ignores an intent belonging to a different stylist or service", () => {
    getBookingIntent.mockReturnValue({
      stylerId: "other-stylist",
      subServiceId: "ss1",
      month: "October",
      day: 9,
      time: "10:30 am",
      serviceType: "homeService",
    });

    renderOpen();

    // September (the current month) stays selected; nothing was hijacked.
    expect(document.querySelector("select").value).toBe(new Date().toLocaleString("en-US", { month: "long" }));
    expect([...document.querySelectorAll("div")].some(
      (el) => el.className.includes("bg-brand") && el.textContent.trim() === "10:30 am"
    )).toBe(false);
  });

  test("an outside-hours restored time is dropped instead of reaching the submit button", () => {
    getBookingIntent.mockReturnValue({
      stylerId: "s1",
      subServiceId: "ss1",
      month: "September",
      day: 9,
      time: "4:00 am",
      serviceType: "visitBarber",
    });
    // The stylist works from 9am: 4:00 am is outside working hours.
    APIService.singleStylerData.mockResolvedValue({
      data: { data: {
        availability: [{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }],
        bookedSlots: [],
        exceptions: [],
      }},
    });

    renderOpen();

    const stalePick = [...document.querySelectorAll("div")].find(
      (el) => el.className.includes("bg-brand") && el.textContent.trim() === "4:00 am"
    );
    expect(stalePick, "a restored time outside working hours must not stay selected").toBeUndefined();
  });
});

describe("SelectService shows the stylist's time zone on the pickers", () => {
  test("the arrival-time block names the stylist's local time zone when provided", () => {
    render(
      <SelectService
        serviceName="Haircut"
        servicePrice="60"
        stylerId="s1"
        subServiceId="ss1"
        stylerProvince="Ontario"
        stylerTimeZone="America/Toronto"
      />
    );
    fireEvent.click(screen.getByText("Book service"));

    expect(screen.getByText(/Times are in the stylist's local time \(Eastern Time\)/)).toBeInTheDocument();
  });

  test("with no zone data at all, the line states the app's default assumption", () => {
    // The backend reads NULL-zone rows as America/Edmonton, so naming Mountain
    // Time is honest — it is the exact zone the system assumes — and never blank.
    render(<SelectService serviceName="Haircut" servicePrice="60" stylerId="s1" subServiceId="ss1" />);
    fireEvent.click(screen.getByText("Book service"));

    expect(screen.getByText(/Times are in the stylist's local time \(Mountain Time\)/)).toBeInTheDocument();
  });
});

describe("SelectService date strip runs on the stylist's calendar", () => {
  test("a visitor a day ahead of the stylist sees the divergence note and the stylist's today", () => {
    // Pin the browser to 2026-09-16 00:30 Toronto (EDT) — the visitor's
    // calendar says the 16th, but the stylist's Alberta calendar is still on
    // the 15th at 22:30. Fake timers make this deterministic at any real hour.
    vi.useFakeTimers({ now: new Date(2026, 8, 16, 0, 30) });
    process.env.TZ = "America/Toronto";
    try {
      APIService.singleStylerData.mockResolvedValue({
        data: { data: {
          availability: [{ dayOfWeek: 2, startTime: "09:00", endTime: "21:00" }],
          bookedSlots: [],
          exceptions: [],
        }},
      });

      render(
        <SelectService
          serviceName="Haircut"
          servicePrice="60"
          stylerId="s1"
          subServiceId="ss1"
          stylerProvince="Alberta"
          stylerTimeZone="America/Edmonton"
        />
      );
      fireEvent.click(screen.getByText("Book service"));

      // The divergence is real and the note says so honestly.
      expect(screen.getByText(/different calendar day than the stylist/)).toBeInTheDocument();

      // The strip's "today" cell is the stylist's 15th (their calendar), even
      // though the visitor's own calendar says the 16th.
      expect(screen.getByText(/15th · today/)).toBeInTheDocument();
      expect(screen.queryByText(/16th · today/)).not.toBeInTheDocument();

      // The stylist's "yesterday by the visitor's clock" (the 15th, a
      // Tuesday they work) must NOT be hidden as a past day.
      const fifteenth = [...document.querySelectorAll("div")].find(
        (el) => el.className.includes("rounded-md") && /Tue, 15th/.test(el.textContent)
      );
      expect(fifteenth).toBeDefined();
      expect(fifteenth.className).not.toContain("hidden");
    } finally {
      vi.useRealTimers();
      process.env.TZ = "UTC";
    }
  });

  test("matching calendars show no divergence note", () => {
    // Toronto 2026-09-15 14:00: the visitor and an Alberta stylist agree on
    // the date (only one hour apart).
    vi.useFakeTimers({ now: new Date(2026, 8, 15, 14, 0) });
    process.env.TZ = "America/Toronto";
    try {
      APIService.singleStylerData.mockResolvedValue({
        data: { data: { availability: [], bookedSlots: [], exceptions: [] } },
      });

      render(
        <SelectService
          serviceName="Haircut"
          servicePrice="60"
          stylerId="s1"
          subServiceId="ss1"
          stylerProvince="Alberta"
          stylerTimeZone="America/Edmonton"
        />
      );
      fireEvent.click(screen.getByText("Book service"));

      expect(screen.queryByText(/different calendar day than the stylist/)).not.toBeInTheDocument();
      expect(screen.getByText(/15th · today/)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      process.env.TZ = "UTC";
    }
  });
});

describe("Stylist address in the booking modal", () => {
  const openWith = (address) => {
    render(
      <SelectService
        serviceName="Haircut"
        servicePrice="60"
        stylerId="s1"
        subServiceId="ss1"
        stylerProvince="Alberta"
        stylerTimeZone="America/Edmonton"
        stylerAddress={address}
      />
    );
    fireEvent.click(screen.getByText("Book service"));
  };

  test("shows the address on open, before any date or time is picked", () => {
    openWith({
      businessAddress: "700 2 St SW",
      city: "Calgary",
      province: "Alberta",
      postalCode: "T2P 2W1",
    });

    // The default service type is visiting the stylist, so the client should
    // not have to choose a slot to find out where they are going.
    expect(screen.getByText("Where you'll go")).toBeInTheDocument();
    expect(screen.getByText("700 2 St SW, Calgary, Alberta, T2P 2W1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Get directions" })
    ).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=700%202%20St%20SW%2C%20Calgary%2C%20Alberta%2C%20T2P%202W1"
    );
  });

  test("builds the line from street parts when no formatted address is saved", () => {
    openWith({ streetAddress: "12 Portage Ave", unit: "4B", city: "Winnipeg" });

    expect(screen.getByText("Unit 4B 12 Portage Ave, Winnipeg")).toBeInTheDocument();
  });

  test("hides the address for home service, where the client is not travelling", () => {
    openWith({ businessAddress: "700 2 St SW", city: "Calgary" });

    fireEvent.click(screen.getByText("Home service"));
    expect(screen.queryByText("Where you'll go")).not.toBeInTheDocument();
  });

  test("says so plainly when the stylist has published no street address", () => {
    openWith({ city: "Calgary", province: "Alberta" });

    // A city alone is not a destination, so it is offered as context and never
    // as an address with a directions link to the middle of town.
    expect(
      screen.getByText("This professional has not published an address yet.")
    ).toBeInTheDocument();
    expect(screen.getByText("Based in Calgary, Alberta")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Get directions" })).not.toBeInTheDocument();
  });

  test("survives a missing address prop", () => {
    render(
      <SelectService
        serviceName="Haircut"
        servicePrice="60"
        stylerId="s1"
        subServiceId="ss1"
      />
    );
    fireEvent.click(screen.getByText("Book service"));

    expect(
      screen.getByText("This professional has not published an address yet.")
    ).toBeInTheDocument();
  });
});

describe("Booking confirmation names the stylist's clock", () => {
  it("puts the stylist's zone beside the picked time", () => {
    expect(bookingConfirmationMessage("Tue, 19th", "4:00 pm", "Mountain Time")).toBe(
      "Booking request sent for Tue, 19th at 4:00 pm (Mountain Time). The stylist will confirm shortly."
    );
  });

  it("states the time without a zone when the stylist's row declares none", () => {
    // Never guess a clock: the picker's own label is what the customer was
    // shown, and an unknown zone prints nothing rather than "Mountain Time".
    expect(bookingConfirmationMessage("Tue, 19th", "4:00 pm", "")).toBe(
      "Booking request sent for Tue, 19th at 4:00 pm. The stylist will confirm shortly."
    );
  });

  it("degrades to the plain acknowledgement when no slot was recorded", () => {
    expect(bookingConfirmationMessage("", "", "")).toBe(
      "Booking request sent. The stylist will confirm shortly."
    );
  });

  it("the toast after a real booking carries the day, the time and the zone", async () => {
    getAuthToken.mockReturnValue("token");
    APIService.bookAppointment.mockResolvedValue({ data: { data: {} } });

    render(
      <SelectService
        serviceName="Braids"
        servicePrice="80"
        stylerId="s1"
        subServiceId="ss1"
        stylerProvince="Alberta"
        stylerTimeZone="America/Edmonton"
      />
    );
    fireEvent.click(screen.getByText("Book service"));
    fireEvent.click(screen.getByText("4:00 pm"));
    fireEvent.click(screen.getAllByText(/15/)[0]);
    fireEvent.click(screen.getByText("Book appointment"));

    await waitFor(() => expect(showSuccessToastMessage).toHaveBeenCalled());
    const toast = showSuccessToastMessage.mock.calls.at(-1)[0];
    expect(toast).toContain("at 4:00 pm (Mountain Time)");
    // The day is named in the stylist's calendar, the same words the strip used.
    expect(toast).toMatch(/Booking request sent for \w{3}, 15th at 4:00 pm/);
  });
});

describe("How far the stylist is, in the booking modal", () => {
  const CALGARY = { latitude: 51.0447, longitude: -114.0719 };
  const NORTH_CALGARY = { latitude: 51.1537, longitude: -114.1797 };
  const ESTIMATE = "About 14 km away, roughly 30 min by road.";

  const openVisit = (stylerProps = {}) => {
    render(
      <SelectService
        serviceName="Haircut"
        servicePrice="60"
        stylerId="s1"
        subServiceId="ss1"
        stylerProvince="Alberta"
        stylerTimeZone="America/Edmonton"
        stylerAddress={{ businessAddress: "700 2 St SW", city: "Calgary" }}
        stylerLatitude={NORTH_CALGARY.latitude}
        stylerLongitude={NORTH_CALGARY.longitude}
        {...stylerProps}
      />
    );
    fireEvent.click(screen.getByText("Book service"));
  };

  afterEach(() => {
    locationMock.current = { latitude: null, longitude: null, source: "gps" };
  });

  test("shows the distance and a rough drive time beside the address", () => {
    locationMock.current = { ...CALGARY, source: "gps" };

    openVisit();

    // The home-service fee already needs these coordinates; a customer reading
    // the address should not have to compute the trip themselves.
    expect(screen.getByText(ESTIMATE)).toBeInTheDocument();
  });

  test("marks a coarse position instead of passing it off as measured", () => {
    locationMock.current = { ...CALGARY, source: "ip" };

    openVisit();

    expect(screen.getByText(`${ESTIMATE} Based on your approximate location.`)).toBeInTheDocument();
  });

  test("says nothing when the customer's position is unknown", () => {
    locationMock.current = { city: "Calgary", province: "Alberta", source: "manual" };

    openVisit();

    // No coordinates means no distance, and a made-up one would be worse than
    // silence: the address and its directions link still stand on their own.
    expect(screen.getByText("Where you'll go")).toBeInTheDocument();
    expect(screen.queryByText(/by road/)).not.toBeInTheDocument();
  });

  test("says nothing when the stylist's profile has no coordinates", () => {
    locationMock.current = { ...CALGARY, source: "gps" };

    openVisit({ stylerLatitude: null, stylerLongitude: null });

    expect(screen.queryByText(/by road/)).not.toBeInTheDocument();
  });

  test("drops the trip when the stylist travels to the customer instead", () => {
    locationMock.current = { ...CALGARY, source: "gps" };

    openVisit();
    expect(screen.getByText(ESTIMATE)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Home service"));

    // Nobody is travelling, so the visit card and its trip estimate go away
    // rather than reporting a journey that will not happen.
    expect(screen.queryByText(ESTIMATE)).not.toBeInTheDocument();
  });
});
