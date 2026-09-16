/**
 * Guard for the stylist dashboard chrome. The sidebar used to be eight copied
 * blocks with a solid purple slab for the active item, and the top bar a
 * purple-tinted band with a solid brand button. These tests pin the quieter
 * hairline register so it cannot creep back.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StylerLayout from "./stylerLayout";
import StylerTopBar from "./topNav";

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    stylerSignOut: vi.fn(),
    // The listing notice fetches the summary; the columns are stubbed below.
    getStylerBusinessSummary: vi.fn(() => Promise.resolve({ data: { data: null } })),
  },
}));

vi.mock("../../../utils/constant", () => ({
  getAuthToken: vi.fn(() => "token"),
  getUserRole: vi.fn(() => "STYLER"),
  clearAllSessionTokens: vi.fn(),
  setIntendedRoute: vi.fn(),
}));

vi.mock("../stylerComponents/businessSummary", () => ({ default: () => <aside>summary</aside> }));
vi.mock("../stylerComponents/reviewsSummary", () => ({ default: () => <aside>reviews</aside> }));
vi.mock("../stylerComponents/listingStatusNotice", () => ({ default: () => null }));

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={["/styler-dashboard/appointments"]}>
      <StylerLayout />
    </MemoryRouter>
  );

describe("the stylist sidebar", () => {
  it("renders every section once, from one nav list", () => {
    renderLayout();
    const nav = screen.getByRole("navigation");
    for (const label of [
      "Overview",
      "Appointments",
      "Calendar",
      "Availability",
      "Services",
      "My work",
      "Payouts",
      "Reviews",
      "My profile",
    ]) {
      expect(screen.getAllByText(label).length).toBe(1);
    }
    expect(nav.querySelectorAll("a").length).toBe(9);
  });

  it("marks the active section with a quiet brand pill, never the solid slab", () => {
    renderLayout();
    const active = screen.getByText("Appointments");
    expect(active.className).toMatch(/bg-brand\/10/);
    expect(active.className).toMatch(/text-brand/);
    expect(active.className).not.toMatch(/bg-brand text-white/);
    expect(active.getAttribute("aria-current")).toBe("page");
  });

  it("offers sign out as a quiet item, not a brand button", () => {
    renderLayout();
    const nav = screen.getByRole("navigation");
    const signOut = Array.from(nav.querySelectorAll("button")).find(
      (b) => b.textContent === "Sign out"
    );
    expect(signOut).toBeTruthy();
    expect(signOut.className).not.toMatch(/bg-brand/);
  });
});

describe("the stylist top bar", () => {
  it("is a hairline bar, not the purple-tinted band", () => {
    const { container } = render(<StylerTopBar />);
    const bar = container.firstChild;
    expect(bar.className).toMatch(/border-black\/10/);
    expect(bar.className).not.toMatch(/F7F5FF/);
  });

  it("signs out through a hairline pill, not a solid brand button", () => {
    render(<StylerTopBar />);
    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button.className).toMatch(/border/);
    expect(button.className).not.toMatch(/bg-brand/);
  });
});
