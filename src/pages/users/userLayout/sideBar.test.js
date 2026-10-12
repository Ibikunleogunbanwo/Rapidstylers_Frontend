/**
 * Guard for the customer dashboard chrome, mirroring the stylist layout's
 * guards: one nav list per breakpoint, the quiet brand-tinted active pill,
 * and the hairline top bar — never the solid purple slab or the dark band.
 */
import { render, screen, fireEvent } from "@testing-library/react";
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
      "Notifications",
      "Saved professionals",
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
    // UserTopBar renders a router Link, so it needs a router context.
    const { container } = render(<MemoryRouter><UserTopBar /></MemoryRouter>);
    const bar = container.firstChild;
    expect(bar.className).toMatch(/border-black\/10/);
    expect(bar.className).not.toMatch(/1d1d1d/);
    expect(bar.className).not.toMatch(/text-white/);
  });
});

test("customer navigation has an accessible menu and close control", () => {
 const toggle = vi.fn(), close = vi.fn();
 render(<MemoryRouter><UserTopBar toggleSideBar={toggle} menuOpen={true} />
 <UserSideBar sideBarVisibility={true} closeSideBar={close} /></MemoryRouter>);
 const menu = screen.getByRole("button", { name: "Close dashboard navigation" });
 expect(menu).toHaveAttribute("aria-expanded", "true");
 fireEvent.click(menu); expect(toggle).toHaveBeenCalledOnce();
 fireEvent.click(screen.getByRole("button", { name: "Close navigation" }));
 expect(close).toHaveBeenCalledOnce();
});

test("Sign Out is a button running the logout action, never a GET link to /signOut (QA C-15)", () => {
 const onSignOut = vi.fn(), close = vi.fn();
 const { container } = render(<MemoryRouter><UserSideBar sideBarVisibility={true} sideBarTitle="" closeSideBar={close} onSignOut={onSignOut} /></MemoryRouter>);
 expect(container.querySelector('a[href="/signOut"]')).toBeNull();
 const [desktop, mobile] = screen.getAllByRole("button", { name: "Sign Out" });
 fireEvent.click(desktop);
 expect(onSignOut).toHaveBeenCalledTimes(1);
 fireEvent.click(mobile);
 expect(onSignOut).toHaveBeenCalledTimes(2);
 expect(close).toHaveBeenCalledOnce();
});

test("the Notifications item shows the unread count (QA C-08)", () => {
 render(<MemoryRouter><UserSideBar sideBarVisibility={false} sideBarTitle="" closeSideBar={() => {}} unreadNotifications={3} /></MemoryRouter>);
 const links = screen.getAllByRole("link", { name: /Notifications, 3 unread/ });
 expect(links).toHaveLength(2);
 expect(links[0]).toHaveTextContent("3");
});

test("the customer header shows who is signed in and a Sign out button (QA C-16)", () => {
 const onSignOut = vi.fn();
 render(<MemoryRouter><UserTopBar toggleSideBar={() => {}} account={{ firstname: "José", lastname: "O'Brien" }} onSignOut={onSignOut} /></MemoryRouter>);
 expect(screen.getByText("José O'Brien")).toBeInTheDocument();
 expect(screen.getByText("JO")).toBeInTheDocument();
 fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
 expect(onSignOut).toHaveBeenCalledOnce();
});
