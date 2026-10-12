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
    // The payout-setup notice fetches the connect status; a null leaves it silent.
    getStylerConnectStatus: vi.fn(() => Promise.resolve({ data: { data: null } })),
  },
}));

vi.mock("../../../utils/constant", async (importOriginal) => ({
  ...await importOriginal(),
  getAuthToken: vi.fn(() => "token"),
  getUserRole: vi.fn(() => "STYLER"),
  clearAllSessionTokens: vi.fn(),
  setIntendedRoute: vi.fn(),
}));

// The sidebar badge reads the stylist's unread count through the bare client.
vi.mock("../../../hooks/remote/apiClient", () => ({ ApiClient: { get: vi.fn(() => Promise.resolve({ data: { data: { items: [], unreadCount: 0 } } })) } }));

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
      "Notifications",
      "Appointments",
      "Calendar",
      "Availability",
      "Services",
      "My work",
      "Payouts",
      "Reviews",
      "My profile",
      "Support",
    ]) {
      expect(nav.querySelectorAll(`a[href="${label === "Overview" ? "/styler-dashboard" : "/styler-dashboard/" + ({"My work":"my-work","My profile":"profile"}[label] || label.toLowerCase())}"]`).length).toBe(1);
    }
    expect(nav.querySelectorAll("a").length).toBe(11);
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

test.each([
  ["/styler-dashboard/update-business-information", "Business information"],
  ["/styler-dashboard/update-cover-photo", "Update photos"],
  ["/styler-dashboard/update-personal-information", "Personal information"],
  ["/styler-dashboard/change-password", "Change password"],
])("profile sub-page %s is titled %s and keeps My profile highlighted", (path, title) => {
  renderLayout(path);
  expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  expect(document.title).toBe(`${title} | RapidStylers`);
  const profile = screen.getByRole("link", { name: "My profile" });
  expect(profile.className).toMatch(/bg-brand\/10/);
  expect(profile).toHaveAttribute("aria-current", "true");
  expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
});

test.each([
  ["/styler-dashboard", "Overview | RapidStylers"],
  ["/styler-dashboard/appointments", "Appointments | RapidStylers"],
  ["/styler-dashboard/services", "Services | RapidStylers"],
  ["/styler-dashboard/profile", "My profile | RapidStylers"],
])("sets the tab title for %s", (path, title) => {
  document.title = "Reviews | RapidStylers";
  renderLayout(path);
  expect(document.title).toBe(title);
});

test("Escape closes the mobile menu even when focus is outside it", () => {
  renderLayout();
  const toggle = screen.getByRole("button", { name: "Open dashboard navigation" });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  fireEvent.keyDown(document.body, { key: "Escape" });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(toggle).toHaveFocus();
});

test("the logo has alt text", () => {
  render(<MemoryRouter><StylerTopBar /></MemoryRouter>);
  expect(screen.getByAltText("RapidStylers")).toBeInTheDocument();
});

test("the support page brings its own heading, so the shell adds none", () => {
  renderLayout("/styler-dashboard/support");
  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Support" })).toHaveAttribute("aria-current", "page");
});

import { ApiClient } from "../../../hooks/remote/apiClient";
import { announceUnreadNotifications } from "../../users/userLayout/unreadNotifications";
import { act, waitFor } from "@testing-library/react";

test("the Notifications item carries the stylist's unread count and follows the inbox", async () => {
  ApiClient.get.mockResolvedValueOnce({ data: { data: { items: [], unreadCount: 3 } } });
  renderLayout("/styler-dashboard/notifications");
  expect(await screen.findByRole("link", { name: "Notifications, 3 unread" })).toHaveAttribute("aria-current", "page");
  expect(ApiClient.get).toHaveBeenCalledWith("/styler/notifications");
  // The inbox page brings its own heading; the tab title still comes from the shell.
  expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  expect(document.title).toBe("Notifications | RapidStylers");
  act(() => announceUnreadNotifications(0));
  await waitFor(() => expect(screen.getByRole("link", { name: "Notifications" })).toBeInTheDocument());
});
