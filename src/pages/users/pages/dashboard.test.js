import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import Dashboard from "./dashboard";
import Appointments from "./upcomingAppointments";
// Resolve to the vi.mock of ../userLayout/functionalEffects.
import { useAllUserAppointments, useUserPendingAppointments } from "../userLayout/functionalEffects";

vi.mock("../userLayout/functionalEffects", () => ({
  useAllUserAppointments: vi.fn(() => []),
  useUserPendingAppointments: vi.fn(() => []),
}));
vi.mock("../../../hooks/local/userReducer", async (orig) => {
  const actual = await orig();
  // The dashboard calls dispatch(...).catch(...); a real promise satisfies it.
  return {
    ...actual,
    getUserDetails: () => () => Promise.resolve({}),
  };
});

// The panel-level guard only checks presence; the real Good to know card has
// its own register guard in its own test file.
vi.mock("../../../components/goodToKnow", () => ({
  default: () => <div data-testid="good-to-know" />,
}));

const makeStore = (userDetails) =>
  configureStore({
    reducer: {
      user: () => ({ loading: false, userDetailsData: { userData: userDetails } }),
    },
  });

const renderDash = (userDetails) =>
  render(
    <Provider store={makeStore(userDetails)}>
      <MemoryRouter>
        <Dashboard setPageTitle={vi.fn()} />
      </MemoryRouter>
    </Provider>
  );

describe("Customer dashboard panel", () => {
  it("carries the eyebrow + display heading register like the other panels", () => {
    renderDash({ firstname: "Ada", lastname: "Lovelace", phoneNumber: "1", address: "x" });
    const eyebrow = screen.getByText("Discover professionals");
    expect(eyebrow.className).toContain("text-[11px]");
    expect(eyebrow.className).toContain("uppercase");
    expect(eyebrow.className).toContain("tracking-[0.25em]");
    const heading = screen.getByRole("heading", { name: "Your bookings" });
    expect(heading.className).toContain("font-normal");
    expect(heading.className).toContain("clamp");
    expect(heading.className).toContain("tracking-[-0.02em]");
  });

  it("uses the hairline card register with no old chrome", () => {
    const { container } = renderDash(null);
    const card = container.firstElementChild;
    expect(card.className).toContain("rounded-lg");
    expect(card.className).toContain("border-black/10");
    // The old register must not return.
    expect(card.className).not.toContain("rounded-2xl");
    expect(card.className).not.toContain("shadow-sm");
    expect(card.className).not.toContain("1d1d1d0a");
    const html = container.innerHTML;
    expect(html).not.toContain("9381ff");
    expect(html).not.toContain("gradient");
  });

  it("prompts to complete the profile only when details are missing", () => {
    const incomplete = renderDash({ firstname: "Ada" });
    expect(incomplete.getByText("Complete your profile")).toBeTruthy();
    incomplete.unmount();
    const complete = renderDash({ firstname: "Ada", lastname: "L", phoneNumber: "1", address: "x" });
    expect(complete.queryByText("Complete your profile")).toBeNull();
  });

  it("keeps the Good to know card inside the panel", () => {
    renderDash(null);
    expect(screen.getByTestId("good-to-know")).toBeTruthy();
  });
});

describe("Upcoming appointment card", () => {
  const appt = {
    appointmentDate: "2026-09-20",
    arrivalTime: "14:00:00",
    stylerData: { businessName: "Braid Bar", stylerId: 5, businessAddress: "Calgary" },
    subServiceData: { name: "Knotless braids", serviceTypeName: "Braids" },
    status: "PENDING",
    price: "120",
    appointmentId: 9,
    statusCode: "1",
  };

  it("renders the booking on a hairline card, not a shadowed float", () => {
    const { container } = render(
      <MemoryRouter>
        <Appointments {...appt} />
      </MemoryRouter>
    );
    const html = container.innerHTML;
    expect(html).toContain("rounded-lg");
    expect(html).toContain("border");
    expect(html).not.toContain("shadow-");
    expect(html).not.toContain("rounded-2xl");
  });
});

describe("Appointment cards name the stylist's time zone", () => {
  const zoneAppt = {
    appointmentDate: "2026-09-20",
    arrivalTime: "14:00",
    appointmentId: "a1",
    statusCode: "3",
    status: "Accepted",
    price: "55.00",
    stylerData: { businessName: "Lash Studio", timeZone: "America/Toronto", province: "Ontario" },
    subServiceData: { name: "Lash refill" },
  };

  it("the upcoming-appointment card labels the arrival time with the stylist's zone", () => {
    useUserPendingAppointments.mockReturnValue([zoneAppt]);
    renderDash({ firstname: "Ada", lastname: "Lovelace", phoneNumber: "1", address: "x" });

    // formatTime12 renders 14:00 as 2:00 PM; the label must sit beside it.
    expect(screen.getByText(/2:00 PM \(Eastern Time\)/)).toBeInTheDocument();
  });

  it("a completed card's inline Time row carries the same zone label", () => {
    useUserPendingAppointments.mockReturnValue([]);
    useAllUserAppointments.mockReturnValue([{ ...zoneAppt, statusCode: "0", status: "Completed" }]);
    renderDash({ firstname: "Ada", lastname: "Lovelace", phoneNumber: "1", address: "x" });

    // Both the card and the history row label the zone; assert on the count.
    expect(screen.getAllByText(/2:00 PM \(Eastern Time\)/).length).toBeGreaterThan(0);
  });

  it("cards render bare when the payload carries no zone (older cached rows)", () => {
    useUserPendingAppointments.mockReturnValue([{ ...zoneAppt, stylerData: { businessName: "Lash Studio" } }]);
    renderDash({ firstname: "Ada", lastname: "Lovelace", phoneNumber: "1", address: "x" });

    // No zone in the payload: the time renders without any parenthetical.
    // (The history row keeps its own label from an earlier test's render —
    // scope the assertion to the upcoming card, which renders "2:00 PM" alone.)
    const upcomingCardTime = screen.getAllByText(/2:00 PM/).find(
      (el) => !/Time\)/.test(el.textContent)
    );
    expect(upcomingCardTime).toBeDefined();
    expect(upcomingCardTime.textContent).not.toContain("(");
  });
});
