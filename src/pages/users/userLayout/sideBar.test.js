/**
 * Guard for the customer dashboard chrome, mirroring the stylist layout's
 * guards: one nav list per breakpoint, the quiet brand-tinted active pill,
 * and the hairline top bar — never the solid purple slab or the dark band.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UserSideBar from "./sideBar";
import UserTopBar from "./topBar";

describe("the customer sidebar (desktop list)", () => {
  const renderSideBar = (sideBarTitle = "") =>
    render(
      <MemoryRouter>
        <UserSideBar
          sideBarVisibility={false}
          sideBarTitle={sideBarTitle}
          closeSideBar={() => {}}
        />
      </MemoryRouter>
    );

  it("renders every destination once, from one nav list", () => {
    renderSideBar();
    for (const label of [
      "Dashboard",
      "Book an Appointment",
      "Account Settings",
      "Saved Stylists",
      "Feedback",
    ]) {
      // Desktop list + hidden mobile list both render into the DOM.
      expect(screen.getAllByText(label).length).toBe(2);
    }
  });

  it("marks the active section with the quiet pill and aria-current", () => {
    renderSideBar("Account Settings");
    const links = screen.getAllByText("Account Settings");
    for (const link of links) {
      expect(link.className).toMatch(/bg-brand\/10/);
      expect(link.className).not.toMatch(/bg-brand text-white/);
      expect(link.getAttribute("aria-current")).toBe("page");
    }
    const inactive = screen.getAllByText("Dashboard");
    for (const link of inactive) {
      expect(link.className).not.toMatch(/bg-brand\/10/);
      expect(link.getAttribute("aria-current")).toBeNull();
    }
  });

  it("keeps Sign Out a quiet item that never claims the active pill", () => {
    renderSideBar("Dashboard");
    for (const signOut of screen.getAllByText("Sign Out")) {
      expect(signOut.className).not.toMatch(/bg-brand\/10/);
    }
  });
});

describe("the customer top bar", () => {
  it("is a hairline bar, not the old dark band", () => {
    const { container } = render(<UserTopBar />);
    const bar = container.firstChild;
    expect(bar.className).toMatch(/border-black\/10/);
    expect(bar.className).not.toMatch(/1d1d1d/);
    expect(bar.className).not.toMatch(/text-white/);
  });
});
