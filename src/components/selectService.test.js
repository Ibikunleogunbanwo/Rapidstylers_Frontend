import { render, screen, fireEvent } from "@testing-library/react";
import SelectService from "./selectService";
// Pin the "browser" clock zone so the stylist-calendar tests below can
// construct a guaranteed midnight-boundary divergence (Toronto visitor,
// Alberta stylist). Must run before any Date is created in this file.
process.env.TZ = "America/Toronto";
// Resolves to the vi.mock() below (hoisted), so APIService is the mock.
import { APIService } from "../hooks/remote/apiService";
import { getBookingIntent, setBookingIntent } from "../utils/constant";

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
vi.mock("../context/LocationContext", () => ({
  useUserLocation: () => ({ location: { latitude: null, longitude: null } }),
}));
vi.mock("../utils/constant", () => ({
  // Vitest (unlike Jest's CJS interop) throws on a named export the mock does
  // not define, so every constant selectService.js imports must be listed here.
  STRIPE_PUBLISHABLE_KEY: "",
  getAuthToken: () => null,
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
