import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SelectService, { bookingConfirmationMessage } from "./selectService";
// Pin the "browser" clock zone so the stylist-calendar tests below can
// construct a guaranteed midnight-boundary divergence (Toronto visitor,
// Alberta stylist). Must run before any Date is created in this file.
process.env.TZ = "America/Toronto";
// Resolves to the vi.mock() below (hoisted), so APIService is the mock.
import { APIService } from "../hooks/remote/apiService";
import { zoneDisplayName } from "../utils/vendorTimeZone";
import { getBookingIntent, setBookingIntent, getAuthToken, showSuccessToastMessage } from "../utils/constant";

// react-scripts resets mock implementations between tests, so the factory only
// creates the fns and beforeEach wires the resolved values — the same pattern
// the existing apiService.test.js uses.
vi.mock("../hooks/remote/apiService", () => ({
  APIService: {
    singleStylerData: vi.fn(),
    estimateBooking: vi.fn(),
    bookAppointment: vi.fn(),
    checkPromoCode: vi.fn(),
    // The home-visit address field asks these for suggestions.
    placeAutocomplete: vi.fn(),
    placeDetails: vi.fn(),
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
  getSessionRevision: () => 0,
}));

beforeEach(() => {
  // A stored intent from an earlier test would reopen the modal on that test's
  // (now past) month and day.
  getBookingIntent.mockReturnValue(null);
  APIService.singleStylerData.mockResolvedValue({
    data: { data: { availability: [], bookedSlots: [], exceptions: [] } },
  });
  // A priced quote by default: booking only goes ahead on one.
  APIService.estimateBooking.mockResolvedValue({
    data: { statusCode: "200", data: { servicePrice: "80.00", travelFee: "0.00", totalPrice: "80.00" } },
  });
  APIService.placeAutocomplete.mockResolvedValue({ data: { data: [] } });
});

// Types an address into the home-visit field and leaves it, the way a customer
// does when no suggestion is picked; the field then hands over the typed text.
const enterVisitAddress = (text) => {
  const field = screen.getByPlaceholderText("Start typing your address…");
  fireEvent.change(field, { target: { value: text } });
  fireEvent.blur(field);
};

// The button stays disabled while the price for the current choices is being
// fetched, the way a customer meets it; wait for the quote like they would.
const clickBook = async () => {
  const button = screen.getByRole("button", { name: "Book appointment" });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
};

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

// A bookable day in the month grid (past and closed days are disabled).
const firstOpenDay = () => {
  const days = screen.getAllByRole("button", { name: /^[A-Z][a-z]{2}, \d+(st|nd|rd|th)/ });
  // Prefer a day after today, so a late-afternoon run still finds 4:00 pm open.
  const open = days.find((button) => !button.disabled && !/today/.test(button.getAttribute("aria-label")))
    || days.find((button) => !button.disabled);
  if (!open) throw new Error("no bookable day in the calendar");
  lastPickedDay = Number(open.textContent.match(/\d+/)[0]);
  return open;
};
// The day number firstOpenDay() last returned, for assertions about the booked date.
let lastPickedDay = null;
const ordinalOf = (n) => `${n}${[11, 12, 13].includes(n % 100) ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th")}`;

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
    // It must actually be visible once opened, and announced as a modal dialog.
    expect(overlay).not.toHaveAttribute("hidden");
    expect(screen.getByRole("dialog", { name: "Book Haircut" })).toHaveAttribute("aria-modal", "true");
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
    expect(document.querySelector("div.fixed")).not.toHaveAttribute("hidden");

    // The close button sits in the sticky header of the booking dialog.
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(document.querySelector("div.fixed")).toHaveAttribute("hidden");
  });

  test("closes on Escape", () => {
    renderOpen();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(document.querySelector("div.fixed")).toHaveAttribute("hidden");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("shows no arrival times until a date is picked", () => {
    renderOpen();
    expect(screen.getByText("Pick a date to see available times.")).toBeInTheDocument();
    expect(screen.queryByText("4:00 pm")).toBeNull();
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
    fireEvent.click(firstOpenDay());
    expect(setBookingIntent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("4:00 pm"));
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
    const activeTime = [...document.querySelectorAll("button")].find(
      (el) => el.className.includes("bg-brand") && el.textContent.trim() === "10:30 am"
    );
    expect(activeTime, "the picked time must be re-highlighted on reopen").toBeTruthy();
    expect(screen.getByRole("button", { name: "Home service", exact: true })).toHaveAttribute("aria-pressed", "true");
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
    expect([...document.querySelectorAll("div, button")].some(
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

    const stalePick = [...document.querySelectorAll("div, button")].find(
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

    expect(screen.getByText(`Times are in the stylist's local time (${zoneDisplayName("America/Toronto")}).`)).toBeInTheDocument();
  });

  test("with no zone data at all, the line states the app's default assumption", () => {
    // The backend reads NULL-zone rows as America/Edmonton, so naming Mountain
    // Time is honest — it is the exact zone the system assumes — and never blank.
    render(<SelectService serviceName="Haircut" servicePrice="60" stylerId="s1" subServiceId="ss1" />);
    fireEvent.click(screen.getByText("Book service"));

    expect(screen.getByText(`Times are in the stylist's local time (${zoneDisplayName("America/Edmonton")}).`)).toBeInTheDocument();
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
      expect(screen.getByRole("button", { name: /15th · today/ })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /16th · today/ })).not.toBeInTheDocument();

      // The stylist's "yesterday by the visitor's clock" (the 15th, a
      // Tuesday they work) must NOT be hidden as a past day.
      const fifteenth = screen.getByRole("button", { name: /Tue, 15th/ });
      expect(fifteenth).not.toHaveAttribute("title", "This date has passed");
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
      expect(screen.getByRole("button", { name: /15th · today/ })).toBeInTheDocument();
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
  it("retries an uncertain booking with the same idempotency key", async () => {
    sessionStorage.clear();
    getAuthToken.mockReturnValue("token");
    APIService.bookAppointment.mockReset();
    APIService.bookAppointment.mockRejectedValueOnce(Object.assign(new Error("timeout"), { code: "ECONNABORTED" }))
      .mockResolvedValueOnce({ data: { data: {} } });
    render(<SelectService serviceName="Braids" servicePrice="80" stylerId="s1" subServiceId="ss1" stylerProvince="Alberta" />);
    fireEvent.click(screen.getByText("Book service"));
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    await clickBook();
    expect(await screen.findByText(/could not confirm whether your booking/i)).toBeInTheDocument();
    const key = APIService.bookAppointment.mock.calls[0][1];
    expect(key).toEqual(expect.any(String));
    await clickBook();
    await screen.findByTestId("booking-placed");
    expect(APIService.bookAppointment.mock.calls[1][1]).toBe(key);
  });
  it("puts the stylist's zone beside the picked time", () => {
    expect(bookingConfirmationMessage("Tue, 19th", "4:00 pm", "Mountain Time")).toBe(
      "Booking request sent for Tue, 19th at 4:00 pm (Mountain Time). The stylist will confirm shortly."
    );
  });

  it("keeps the day but drops the hour when the stylist's clock cannot be named", () => {
    // Never guess a clock, and never print a time that belongs to no stated
    // zone: the day survives, and the booking's own row keeps the hour. The
    // rule itself is held in place by utils/copyTimezone.test.js.
    expect(bookingConfirmationMessage("Tue, 19th", "4:00 pm", "")).toBe(
      "Booking request sent for Tue, 19th. The stylist will confirm shortly."
    );
    expect(bookingConfirmationMessage("Tue, 19th", "4:00 pm", "")).not.toMatch(/4:00/);
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
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    await clickBook();

    await waitFor(() => expect(showSuccessToastMessage).toHaveBeenCalled());
    const toast = showSuccessToastMessage.mock.calls.at(-1)[0];
    expect(toast).toContain(`at 4:00 pm (${zoneDisplayName("America/Edmonton")})`);
    // The day is named in the stylist's calendar, the same words the strip used.
    expect(toast).toMatch(new RegExp(`Booking request sent for \\w{3}, ${ordinalOf(lastPickedDay)} at 4:00 pm`));
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

// The minute after a booking lands is the only moment the customer can still be
// saved from missing it, so the confirmation stays on screen and offers the
// appointment to their own calendar. The entry has to land on the hour the
// professional's clock said, in whatever zone the customer's calendar uses.
describe("Adding a fresh booking to a calendar", () => {
  const bookVisit = async (stylerProps = {}) => {
    getAuthToken.mockReturnValue("token");
    APIService.bookAppointment.mockResolvedValue({ data: { data: {} } });

    render(
      <SelectService
        serviceName="Braids"
        servicePrice="80"
        durationMinutes={90}
        stylerId="s1"
        subServiceId="ss1"
        stylerProvince="Alberta"
        stylerTimeZone="America/Edmonton"
        stylerName="Demo Hairstylist Studio"
        stylerAddress={{ businessAddress: "700 2 St SW", city: "Calgary" }}
        {...stylerProps}
      />
    );
    fireEvent.click(screen.getByText("Book service"));
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    await clickBook();
    return screen.findByTestId("booking-placed");
  };

  const calendarParams = () => {
    const link = screen.getByText("Add to Google Calendar");
    return new URLSearchParams(link.getAttribute("href").split("?")[1]);
  };

  // Reads a UTC stamp from the calendar link back in the professional's zone.
  const inStylistZone = (stamp, options) => {
    const iso = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:00Z`;
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Edmonton", ...options })
      .format(new Date(iso));
  };

  it("offers the appointment to the customer's calendar as soon as it lands", async () => {
    const panel = await bookVisit();

    expect(panel).toBeInTheDocument();
    expect(screen.getByText(/Booking request sent for/)).toBeInTheDocument();
    expect(screen.getByText("Download calendar file (.ics)")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("writes the entry at the professional's hour, not the visitor's", async () => {
    await bookVisit();

    const [start] = calendarParams().get("dates").split("/");
    // The customer picked 4:00 pm on that day in the stylist's calendar, so the
    // instant carried by the link must be that hour in Calgary.
    expect(inStylistZone(start, { hour: "numeric", hour12: false })).toBe("16");
    expect(inStylistZone(start, { day: "numeric" })).toBe(String(lastPickedDay));
  });

  it("names the professional's zone and the service in the entry", async () => {
    await bookVisit();

    const params = calendarParams();
    expect(params.get("text")).toBe("Braids with Demo Hairstylist Studio");
    expect(params.get("details")).toContain(zoneDisplayName("America/Edmonton"));
    expect(params.get("details")).toContain("America/Edmonton");
    expect(params.get("location")).toBe("700 2 St SW, Calgary");
  });

  it("points nowhere when the professional is the one travelling", async () => {
    locationMock.current = { latitude: 51.0447, longitude: -114.0719, source: "gps" };
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
        stylerAddress={{ businessAddress: "700 2 St SW", city: "Calgary" }}
        // The home-visit fee needs the premises, so the guard that refuses a
        // booking without a calculable distance does not fire here.
        stylerLatitude={51.1537}
        stylerLongitude={-114.1797}
      />
    );
    fireEvent.click(screen.getByText("Book service"));
    fireEvent.click(screen.getByText("Home service"));
    enterVisitAddress("10 Main St, Calgary");
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    await clickBook();
    await screen.findByTestId("booking-placed");

    // A home visit has no address in this modal, and inventing one would send
    // the customer to a door that is not theirs.
    expect(calendarParams().get("location")).toBeNull();
    expect(calendarParams().get("details")).toContain("travels to your address");
  });

  it("hands over a calendar file carrying the same instant as the link", async () => {
    await bookVisit();
    URL.createObjectURL = vi.fn(() => "blob:ics");
    URL.revokeObjectURL = vi.fn();

    fireEvent.click(screen.getByText("Download calendar file (.ics)"));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toContain("text/calendar");
    const text = await blob.text();
    expect(text).toContain("BEGIN:VCALENDAR");
    // The two actions must not be able to disagree about the time.
    const [start] = calendarParams().get("dates").split("/");
    expect(text).toContain(`DTSTART:${start}`);
  });
});

// A home visit is priced from the customer's address, measured by the server,
// so a request cannot name its own (smaller) distance. The professional also
// needs the address to know where to go.
describe("Home visit address", () => {
  const openHomeVisit = () => {
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
    fireEvent.click(screen.getByText("Home service"));
  };

  test("asks for the address before pricing the visit", () => {
    openHomeVisit();

    expect(screen.getByText("Where should the professional come?")).toBeInTheDocument();
    expect(screen.getByText("Add your address above to see the travel fee.")).toBeInTheDocument();
    expect(APIService.estimateBooking).not.toHaveBeenCalledWith(
      expect.objectContaining({ serviceTime: "homeService" })
    );
  });

  test("sends the address, not a distance, for the estimate", async () => {
    openHomeVisit();
    enterVisitAddress("10 Main St, Calgary");

    await waitFor(() =>
      expect(APIService.estimateBooking).toHaveBeenCalledWith(
        expect.objectContaining({ serviceTime: "homeService", serviceAddress: "10 Main St, Calgary" })
      )
    );
    const homeCall = APIService.estimateBooking.mock.calls.find(([body]) => body.serviceTime === "homeService");
    expect(homeCall[0]).not.toHaveProperty("travelDistanceKm");
  });

  test("shows the server's reason when the address cannot be priced", async () => {
    APIService.estimateBooking.mockImplementation((body) =>
      body.serviceTime === "homeService"
        ? Promise.reject({ response: { data: { message: "We couldn't find that address. Check it and try again" } } })
        : Promise.resolve({ data: { data: null } })
    );
    openHomeVisit();
    enterVisitAddress("nowhere at all");

    expect(
      await screen.findByText("We couldn't find that address. Check it and try again")
    ).toBeInTheDocument();
  });

  test("will not book a home visit without an address", () => {
    openHomeVisit();
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    fireEvent.click(screen.getByText("Book appointment"));

    expect(APIService.bookAppointment).not.toHaveBeenCalled();
  });

  test("books the visit with the address the customer gave", async () => {
    openHomeVisit();
    enterVisitAddress("10 Main St, Calgary");
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    await clickBook();
    await screen.findByTestId("booking-placed");

    const [body] = APIService.bookAppointment.mock.calls.at(-1);
    expect(body).toEqual(expect.objectContaining({ serviceTime: "homeService", serviceAddress: "10 Main St, Calgary" }));
    expect(body).not.toHaveProperty("travelDistanceKm");
  });
});

describe("SelectService on the demo showroom", () => {
  const renderDemo = (demoMode) => {
    render(<SelectService serviceName="Haircut" servicePrice="60" stylerId="s1" subServiceId="ss1" demoMode={demoMode} />);
    fireEvent.click(screen.getByText("Book service"));
  };

  test("before launch the form opens but the booking cannot be submitted", () => {
    renderDemo("closed");
    expect(screen.getByRole("button", { name: "Booking opens at launch" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Book appointment" })).toBeNull();
  });

  test("after launch the submit button sends visitors to the live site", () => {
    renderDemo("live");
    expect(screen.getByRole("link", { name: "Book on rapidstylers.ca" })).toHaveAttribute("href", "https://rapidstylers.ca");
    expect(APIService.bookAppointment).not.toHaveBeenCalled();
  });

  test("the live site keeps its normal booking button", () => {
    renderDemo(null);
    expect(screen.getByRole("button", { name: "Book appointment" })).toBeInTheDocument();
  });
});

describe('Offered appointment locations and promotions',()=>{
 const open=(props={})=>{render(<SelectService serviceName="Haircut" servicePrice="60" stylerId="s1" subServiceId="ss1" stylerTimeZone="America/Edmonton" {...props}/>);fireEvent.click(screen.getByText('Book service'));};
 test('home-only professional defaults to home service and disallows salon visits',()=>{open({offersSalonVisits:false,offersHomeVisits:true});expect(screen.getByRole('button',{name:'Visit the stylist'})).toBeDisabled();expect(screen.getByRole('button',{name:'Home service'})).toHaveAttribute('aria-pressed','true');expect(screen.getByText('Where should the professional come?')).toBeInTheDocument();});
 test('salon-only professional disables home service',()=>{open({offersSalonVisits:true,offersHomeVisits:false});expect(screen.getByRole('button',{name:'Home service'})).toBeDisabled();expect(screen.getByRole('button',{name:'Visit the stylist'})).toHaveAttribute('aria-pressed','true');});
 test('no offered location cannot send a booking request',()=>{open({offersSalonVisits:false,offersHomeVisits:false});expect(screen.getByRole('button',{name:'Home service'})).toBeDisabled();expect(screen.getByRole('button',{name:'Visit the stylist'})).toBeDisabled();fireEvent.click(screen.getByRole('button',{name:'Book appointment'}));expect(APIService.bookAppointment).not.toHaveBeenCalled();});
 test('booking sends the verified promo code, with server-authoritative totals',async()=>{
  getAuthToken.mockReturnValue('token');APIService.bookAppointment.mockResolvedValue({data:{data:{}}});
  APIService.estimateBooking.mockResolvedValue({data:{data:{totalPrice:'60.00',servicePrice:'60.00',travelFee:'0.00'}}});
  APIService.checkPromoCode.mockResolvedValue({data:{statusCode:'200',data:{code:'WELCOME',discount:'6.00',total:'54.00'}}});
  open();fireEvent.change(await screen.findByLabelText('Promo code (optional)'),{target:{value:'welcome'}});fireEvent.click(screen.getByRole('button',{name:'Apply'}));await screen.findByText('WELCOME: −$6.00 CAD');
  fireEvent.click(firstOpenDay());fireEvent.click(screen.getByText('4:00 pm'));await clickBook();await screen.findByTestId('booking-placed');
  expect(APIService.bookAppointment.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({promoCode:'WELCOME'}));expect(APIService.bookAppointment.mock.calls.at(-1)[0]).not.toHaveProperty('discount');
 });
 test('editing a verified promo removes the old code from the booking payload',async()=>{
  getAuthToken.mockReturnValue('token');APIService.bookAppointment.mockResolvedValue({data:{data:{}}});
  APIService.estimateBooking.mockResolvedValue({data:{data:{totalPrice:'60.00',servicePrice:'60.00',travelFee:'0.00'}}});APIService.checkPromoCode.mockResolvedValue({data:{statusCode:'200',data:{code:'WELCOME',discount:'6.00',total:'54.00'}}});
  open();const field=await screen.findByLabelText('Promo code (optional)');fireEvent.change(field,{target:{value:'welcome'}});fireEvent.click(screen.getByRole('button',{name:'Apply'}));await screen.findByText('WELCOME: −$6.00 CAD');fireEvent.change(field,{target:{value:'OTHER'}});fireEvent.click(firstOpenDay());fireEvent.click(screen.getByText('4:00 pm'));await clickBook();await screen.findByTestId('booking-placed');expect(APIService.bookAppointment.mock.calls.at(-1)[0]).not.toHaveProperty('promoCode');
 });
});

// A booking goes ahead only on a price the server gave for exactly the choices
// being sent. A failed, missing, loading or out-of-date quote never books, and
// the total never falls back to the listed service price.
describe("Booking waits for a valid price", () => {
  const openSignedIn = (props = {}) => {
    getAuthToken.mockReturnValue("token");
    APIService.bookAppointment.mockResolvedValue({ data: { data: {} } });
    render(<SelectService serviceName="Braids" servicePrice="60" stylerId="s1" subServiceId="ss1"
      stylerTimeZone="America/Edmonton" {...props} />);
    fireEvent.click(screen.getByText("Book service"));
  };
  const pickSlot = () => {
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
  };
  const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
  const quote = (total) => ({ data: { statusCode: "200", data: { servicePrice: total, travelFee: "0.00", totalPrice: total } } });

  test("a failed quote blocks the booking, shows no base-price total and offers a retry", async () => {
    APIService.estimateBooking.mockRejectedValue({ response: { data: { message: "Pricing is down" } } });
    openSignedIn();
    pickSlot();

    expect(await screen.findByText("Pricing is down")).toBeInTheDocument();
    expect(screen.getByTestId("booking-total")).toHaveTextContent("Unavailable");
    expect(screen.getByTestId("booking-total")).not.toHaveTextContent("$60");
    fireEvent.click(screen.getByRole("button", { name: "Book appointment" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Book appointment" })).toBeEnabled());
    expect(APIService.bookAppointment).not.toHaveBeenCalled();

    APIService.estimateBooking.mockResolvedValue(quote("75.00"));
    fireEvent.click(screen.getByRole("button", { name: "Retry estimate" }));
    await waitFor(() => expect(screen.getByTestId("booking-total")).toHaveTextContent("$75.00"));
    await clickBook();
    await screen.findByTestId("booking-placed");
    expect(APIService.bookAppointment).toHaveBeenCalledTimes(1);
  });

  test("a quote with no usable total counts as no quote", async () => {
    APIService.estimateBooking.mockResolvedValue({ data: { statusCode: "200", data: { servicePrice: "60.00" } } });
    openSignedIn();
    pickSlot();
    expect(await screen.findByRole("button", { name: "Retry estimate" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Book appointment" }));
    expect(APIService.bookAppointment).not.toHaveBeenCalled();
  });

  test("while the price loads the button is disabled and no total is shown", async () => {
    const pending = deferred();
    APIService.estimateBooking.mockReturnValue(pending.promise);
    openSignedIn();
    pickSlot();

    const button = screen.getByRole("button", { name: "Book appointment" });
    expect(button).toBeDisabled();
    expect(screen.getByTestId("booking-total")).toHaveTextContent("Calculating…");
    fireEvent.click(button);
    expect(APIService.bookAppointment).not.toHaveBeenCalled();

    pending.resolve(quote("80.00"));
    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.getByTestId("booking-total")).toHaveTextContent("$80.00");
  });

  test("each quote is asked for the date, time, place and people being booked", async () => {
    openSignedIn();
    pickSlot();
    await waitFor(() => expect(APIService.estimateBooking).toHaveBeenLastCalledWith(
      expect.objectContaining({ serviceTime: "visitBarber", noOfPeople: "1", arrivalTime: "16:00",
        appointmentDate: expect.stringMatching(new RegExp(`^\\d{4}-\\d{2}-${String(lastPickedDay).padStart(2, "0")}$`)) })
    ));
  });

  test("changing a choice after pricing re-prices before the booking can go", async () => {
    openSignedIn();
    pickSlot();
    await waitFor(() => expect(screen.getByTestId("booking-total")).toHaveTextContent("$80.00"));

    const pending = deferred();
    APIService.estimateBooking.mockReturnValue(pending.promise);
    fireEvent.change(screen.getByLabelText("Number of people:"), { target: { value: "2" } });
    // The old price no longer belongs to these choices.
    expect(screen.getByTestId("booking-total")).toHaveTextContent("Calculating…");
    expect(screen.getByRole("button", { name: "Book appointment" })).toBeDisabled();

    pending.resolve(quote("160.00"));
    await waitFor(() => expect(screen.getByTestId("booking-total")).toHaveTextContent("$160.00"));
    await clickBook();
    await screen.findByTestId("booking-placed");
    expect(APIService.bookAppointment.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ noOfPeople: "2" }));
  });

  test("signing in books only on a quote for the current choices, fetching a fresh one when stale", async () => {
    getAuthToken.mockReturnValue(null);
    APIService.bookAppointment.mockResolvedValue({ data: { data: {} } });
    render(<SelectService serviceName="Braids" servicePrice="60" stylerId="s1" subServiceId="ss1" />);
    fireEvent.click(screen.getByText("Book service"));
    pickSlot();
    await waitFor(() => expect(screen.getByTestId("booking-total")).toHaveTextContent("$80.00"));
    await clickBook();
    fireEvent.click(await screen.findByText("Already have an account? Sign in"));

    // The choices change while the customer signs in, and that quote is still
    // on its way when they submit: the booking must fetch its own fresh price.
    const stale = deferred();
    APIService.estimateBooking.mockReturnValueOnce(stale.promise).mockResolvedValue(quote("160.00"));
    fireEvent.change(screen.getByLabelText("Number of people:"), { target: { value: "2" } });
    const callsBefore = APIService.estimateBooking.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "a@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in & book" }));

    await screen.findByTestId("booking-placed");
    expect(APIService.estimateBooking.mock.calls.length).toBe(callsBefore + 1);
    expect(APIService.estimateBooking.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ noOfPeople: "2" }));
    expect(APIService.bookAppointment.mock.calls.at(-1)[0]).toEqual(expect.objectContaining({ noOfPeople: "2" }));
    stale.resolve(quote("1.00")); // a superseded answer changes nothing
  });

  test("signing in does not book when the price cannot be confirmed", async () => {
    getAuthToken.mockReturnValue(null);
    render(<SelectService serviceName="Braids" servicePrice="60" stylerId="s1" subServiceId="ss1" />);
    fireEvent.click(screen.getByText("Book service"));
    pickSlot();
    await waitFor(() => expect(screen.getByTestId("booking-total")).toHaveTextContent("$80.00"));
    await clickBook();
    fireEvent.click(await screen.findByText("Already have an account? Sign in"));

    APIService.estimateBooking.mockRejectedValue(new Error("network"));
    fireEvent.change(screen.getByLabelText("Number of people:"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "a@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in & book" }));

    expect(await screen.findByText(/couldn't confirm the price for this booking/i)).toBeInTheDocument();
    expect(APIService.bookAppointment).not.toHaveBeenCalled();
  });
});

// An accepted custom quote: the price, length, visit type and party size were
// agreed with the professional, so the checkout fixes them and sends the quote
// along for the server to price from.
describe("Booking a custom quote", () => {
  const quote = { quoteRef: "QREADY01", price: "420.00", durationMinutes: 180, serviceTime: "visitBarber", noOfPeople: 3 };
  const renderQuote = () => {
    getAuthToken.mockReturnValue("token");
    APIService.bookAppointment.mockResolvedValue({ data: { data: {} } });
    render(
      <SelectService
        serviceName="Knotless braids"
        servicePrice={quote.price}
        durationMinutes={quote.durationMinutes}
        stylerId="s1"
        subServiceId="7"
        stylerProvince="Alberta"
        stylerTimeZone="America/Edmonton"
        stylerAddress={{ businessAddress: "700 2 St SW", city: "Calgary" }}
        quote={quote}
        defaultOpen
      />
    );
  };

  test("opens straight into checkout with the visit type and party size fixed", () => {
    renderQuote();

    expect(screen.getByText("Your custom quote")).toBeInTheDocument();
    expect(screen.getByText("For 3 people, as quoted.")).toBeInTheDocument();
    expect(screen.getByText("Home service").closest("button")).toBeDisabled();
    expect(screen.queryByLabelText("Number of people:")).not.toBeInTheDocument();
  });

  test("prices and books with the quote attached", async () => {
    renderQuote();
    await waitFor(() =>
      expect(APIService.estimateBooking).toHaveBeenCalledWith(expect.objectContaining({ quoteRef: "QREADY01", noOfPeople: "3" }))
    );
    fireEvent.click(firstOpenDay());
    fireEvent.click(screen.getByText("4:00 pm"));
    await clickBook();
    await screen.findByTestId("booking-placed");

    const [body] = APIService.bookAppointment.mock.calls.at(-1);
    expect(body).toEqual(expect.objectContaining({ quoteRef: "QREADY01", subServiceId: "7", serviceTime: "visitBarber", noOfPeople: "3" }));
  });
});

// Times are on the professional's clock, so "already gone today" is judged there:
// at 10:00 AM in Calgary, 9:00 am today is gone and 4:00 pm is not, even for a
// visitor in Toronto, where it is already noon.
describe("Times already gone today", () => {
  test("today's earlier times are not offered; later ones are", () => {
    vi.useFakeTimers({ now: new Date("2026-09-15T16:00:00Z"), toFake: ["Date"] });
    process.env.TZ = "America/Toronto";
    try {
      APIService.singleStylerData.mockResolvedValue({
        data: { data: { availability: [], bookedSlots: [], exceptions: [] } },
      });
      render(
        <SelectService serviceName="Haircut" servicePrice="60" stylerId="s1" subServiceId="ss1"
          stylerProvince="Alberta" stylerTimeZone="America/Edmonton" />
      );
      fireEvent.click(screen.getByText("Book service"));
      fireEvent.click(screen.getByRole("button", { name: /15th · today/ }));

      expect(screen.queryByText("9:00 am")).not.toBeInTheDocument();
      expect(screen.queryByText("10:00 am")).not.toBeInTheDocument();
      expect(screen.getByText("4:00 pm")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      process.env.TZ = "UTC";
    }
  });
});
