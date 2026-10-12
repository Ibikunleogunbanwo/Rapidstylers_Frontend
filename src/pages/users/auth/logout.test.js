import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LogOut from "./logout";

/**
 * QA C-15: /signOut used to end the session on mount, so a plain GET (a stale
 * bookmark, a prefetch, a link on another site) signed people out. It now asks.
 */
const renderPage = (props = {}) =>
  render(
    <MemoryRouter initialEntries={["/signOut"]}>
      <Routes>
        <Route path="/signOut" element={<LogOut {...props} />} />
        <Route path="/dashboard" element={<div data-testid="page-dashboard" />} />
      </Routes>
    </MemoryRouter>
  );

describe("/signOut confirmation", () => {
  test("visiting the page asks and signs nobody out", () => {
    const onConfirm = vi.fn();
    renderPage({ onConfirm });
    expect(screen.getByRole("heading", { name: "Sign out of RapidStylers?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("Sign out signs out", () => {
    const onConfirm = vi.fn();
    renderPage({ onConfirm });
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("Cancel keeps the session and returns to the dashboard", () => {
    const onConfirm = vi.fn();
    renderPage({ onConfirm });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByTestId("page-dashboard")).toBeInTheDocument();
  });
});
