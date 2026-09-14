/**
 * Guard for the shared admin chrome. Every admin page used to hand-roll its
 * own header, nav and cards, which is how they drifted (different nav orders,
 * different max-widths, one page with its own nav copy). These tests pin the
 * shell contract: the AdminPage carries the display-register heading and the
 * section nav, the nav underlines the current route, and AdminCard is hairline
 * — no shadow, no big radius.
 */
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AdminPage, AdminNav, AdminCard, AdminInput, AdminTextarea } from "./adminShell";

const renderAt = (ui, path = "/admin/categories") =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe("AdminPage shell", () => {
  it("renders the eyebrow, the display-register title and the nav", () => {
    renderAt(
      <AdminPage eyebrow="Admin" title="Manage Categories">
        <p>body</p>
      </AdminPage>
    );
    expect(screen.getByText("Admin")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { name: "Manage Categories" });
    // Display register: normal weight, tight tracking — never the old bold.
    expect(heading.className).toMatch(/font-normal/);
    expect(heading.className).not.toMatch(/font-bold/);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("offers all six sections in the nav in one canonical order", () => {
    renderAt(<AdminPage eyebrow="Admin" title="T"><p>b</p></AdminPage>);
    const nav = screen.getByRole("navigation");
    const labels = Array.from(nav.querySelectorAll("a, span")).map((n) => n.textContent);
    expect(labels).toEqual([
      "Categories",
      "Blog",
      "Stylists",
      "Operations",
      "Payments",
      "Recovery",
    ]);
  });

  it("underlines only the current route in the nav", () => {
    renderAt(<AdminPage eyebrow="Admin" title="T"><p>b</p></AdminPage>, "/admin/payments");
    const nav = screen.getByRole("navigation");
    const current = Array.from(nav.querySelectorAll("span")).find(
      (n) => n.textContent === "Payments"
    );
    expect(current.className).toMatch(/underline/);
    const blogLink = Array.from(nav.querySelectorAll("a")).find(
      (a) => a.textContent === "Blog"
    );
    expect(blogLink.getAttribute("href")).toBe("/admin/blog");
  });

  it("carries a sign-out button, plus any extra page actions", () => {
    renderAt(
      <AdminPage
        eyebrow="Admin"
        title="T"
        actions={<button type="button">Refresh</button>}
      >
        <p>b</p>
      </AdminPage>
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});

describe("AdminCard", () => {
  it("is hairline: border, small radius, never shadow or the old 2xl radius", () => {
    render(
      <AdminCard>
        <p>content</p>
      </AdminCard>
    );
    const card = screen.getByText("content").parentElement;
    expect(card.className).toMatch(/border-black\/10/);
    expect(card.className).toMatch(/rounded-lg/);
    expect(card.className).not.toMatch(/shadow/);
    expect(card.className).not.toMatch(/rounded-2xl/);
  });
});

describe("AdminInput and AdminTextarea", () => {
  it("carry the one focus ring, so every control behaves the same", () => {
    render(
      <>
        <AdminInput placeholder="type here" />
        <AdminTextarea placeholder="write here" />
      </>
    );
    for (const el of [screen.getByPlaceholderText("type here"), screen.getByPlaceholderText("write here")]) {
      expect(el.className).toMatch(/border-gray-300/);
      expect(el.className).toMatch(/focus:ring-brand\/40/);
      expect(el.className).not.toMatch(/border-gray-200/);
    }
  });

  it("forwards every prop untouched and appends extra classes", () => {
    render(
      <AdminInput
        type="number"
        min="0"
        step="0.5"
        data-testid="commission"
        className="md:col-span-2"
      />
    );
    const input = screen.getByTestId("commission");
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("step", "0.5");
    expect(input.className).toMatch(/md:col-span-2/);
    expect(input.className).toMatch(/w-full/);
  });

  it("renders the inline variant for the edit rows: flex-1, tighter padding", () => {
    render(<AdminInput variant="inline" placeholder="edit me" />);
    const input = screen.getByPlaceholderText("edit me");
    expect(input.className).toMatch(/flex-1/);
    expect(input.className).toMatch(/py-1\.5/);
    expect(input.className).not.toMatch(/w-full/);
  });
});
