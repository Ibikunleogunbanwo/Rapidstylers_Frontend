/**
 * Guard for the stylist dashboard chrome. The sidebar used to be eight copied
 * blocks with a solid purple slab for the active item, and the top bar a
 * purple-tinted band with a solid brand button. These tests pin the quieter
 * hairline register so it cannot creep back.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import StylerLayout from "./stylerLayout";
import StylerTopBar from "./topNav";

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    logout: vi.fn(),
    stylerSignOut: vi.fn(),
    // The listing notice fetches the summary; the columns are stubbed below.
    getStylerBusinessSummary: vi.fn(() => Promise.resolve({ data: { data: null } })),
  },
}));

vi.mock("../../../utils/constant", async (importOriginal) => ({
  ...await importOriginal(),
  getAuthToken: vi.fn(() => "token"),
  getUserRole: vi.fn(() => "STYLER"),
  clearAllSessionTokens: vi.fn(),
  setIntendedRoute: vi.fn(),
}));

vi.mock("../stylerComponents/businessSummary", () => ({ default: () => <aside>summary</aside> }));
vi.mock("../stylerComponents/reviewsSummary", () => ({ default: () => <aside>reviews</aside> }));
vi.mock("../stylerComponents/listingStatusNotice", () => ({ default: () => null }));

const renderLayout = (path = "/styler-dashboard/appointments") =>
  render(
    <MemoryRouter initialEntries={[path]}>
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
      expect(nav.querySelectorAll(`a[href="${label === "Overview" ? "/styler-dashboard" : "/styler-dashboard/" + ({"My work":"my-work","My profile":"profile"}[label] || label.toLowerCase())}"]`).length).toBe(1);
    }
    expect(nav.querySelectorAll("a").length).toBe(9);
  });

  it("marks the active section with a quiet brand pill, never the solid slab", () => {
    renderLayout();
    const active = screen.getByRole("link", { name: "Appointments", exact: true });
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
    const { container } = render(<MemoryRouter><StylerTopBar /></MemoryRouter>);
    const bar = container.firstChild;
    expect(bar.className).toMatch(/border-black\/10/);
    expect(bar.className).not.toMatch(/F7F5FF/);
  });

  it("signs out through a hairline pill, not a solid brand button", () => {
    render(<MemoryRouter><StylerTopBar /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Sign out" });
    expect(button.className).toMatch(/border/);
    expect(button.className).not.toMatch(/bg-brand/);
  });
});

import { APIService } from "../../../hooks/remote/apiService";
import { setRefreshToken, getRefreshToken, clearAllSessionTokens } from "../../../utils/constant";
 describe("stylist logout", () => {
 afterEach(() => { sessionStorage.clear(); localStorage.clear(); });
 test.each(["top bar", "sidebar"])("%s logout clears account data and revokes refresh before navigation", (surface) => {
 setRefreshToken("refresh"); localStorage.setItem("userSessionData", "stale"); localStorage.setItem("theme", "dark");
 APIService.logout.mockReturnValue(new Promise(() => {}));
 function Probe() { return <p>{useLocation().pathname}</p>; }
 render(<MemoryRouter initialEntries={["/styler-dashboard"]}>{surface === "top bar" ? <StylerTopBar /> : <StylerLayout />}<Probe /></MemoryRouter>);
 const buttons = screen.getAllByRole("button", {name: "Sign out"});
 fireEvent.click(surface === "top bar" ? buttons[0] : buttons[1]);
 expect(clearAllSessionTokens).toHaveBeenCalled();
 expect(localStorage.getItem("userSessionData")).toBeNull();
 expect(localStorage.getItem("theme")).toBe("dark");
 expect(APIService.logout).toHaveBeenCalledWith("refresh");
 expect(APIService.stylerSignOut).toHaveBeenCalledWith("token");
 expect(screen.getByText("/login")).toBeInTheDocument();
 });
 });

test("the mobile menu opens, closes on navigation, and supports Escape", () => {
 renderLayout();
 const toggle = screen.getByRole("button", { name: "Open dashboard navigation" });
 expect(toggle).toHaveAttribute("aria-expanded", "false");
 fireEvent.click(toggle);
 expect(toggle).toHaveAttribute("aria-expanded", "true");
 fireEvent.click(screen.getByRole("link", { name: "Services", exact: true }));
 expect(toggle).toHaveAttribute("aria-expanded", "false");
 fireEvent.click(toggle);
 fireEvent.keyDown(screen.getByRole("navigation"), { key: "Escape" });
 expect(toggle).toHaveAttribute("aria-expanded", "false");
 expect(toggle).toHaveFocus();
});

test("focused tabs do not repeat overview summaries", () => {
  renderLayout();
  expect(screen.queryByText("summary")).not.toBeInTheDocument();
  expect(screen.queryByText("reviews")).not.toBeInTheDocument();
  expect(screen.getByRole("main")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Appointments" })).toBeInTheDocument();
});
test("overview retains business and review summaries", () => {
  renderLayout("/styler-dashboard");
  expect(screen.getByText("summary")).toBeInTheDocument();
  expect(screen.getByText("reviews")).toBeInTheDocument();
});
