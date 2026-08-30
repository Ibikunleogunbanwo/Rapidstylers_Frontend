import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import AdminLogin from "./adminLogin";

// The admin login calls APIService.adminSignIn; stub it to avoid network.
jest.mock("../../hooks/remote/apiService", () => {
  const APIService = { adminSignIn: jest.fn() };
  return { APIService };
});

function LocationProbe() {
  const location = useLocation();
  window.__adminLocationAfterRender = location.pathname;
  return null;
}

const renderAdminLogin = () =>
  render(
    <MemoryRouter initialEntries={["/admin/login"]}>
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/categories" element={<div>CATEGORIES_PAGE</div>} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("AdminLogin signed-in redirect guard", () => {
  const SESSION_KEY = "rapidstylers_auth_token";
  const ADMIN_KEY = "rapidstylers_admin_role";

  beforeEach(() => {
    window.__adminLocationAfterRender = "";
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("redirects an already-signed-in admin to /admin/categories (not home or blank)", () => {
    window.sessionStorage.setItem(SESSION_KEY, "admin-jwt");
    window.sessionStorage.setItem(ADMIN_KEY, "admin");
    renderAdminLogin();
    expect(screen.getByText("CATEGORIES_PAGE")).toBeInTheDocument();
    expect(screen.queryByText("Admin Sign In")).not.toBeInTheDocument();
  });

  it("stays on the form for a signed-out visitor", () => {
    renderAdminLogin();
    expect(screen.getByText("Admin Sign In")).toBeInTheDocument();
    expect(screen.queryByText("CATEGORIES_PAGE")).not.toBeInTheDocument();
  });

  it("does NOT auto-redirect a signed-in non-admin (token but no admin role)", () => {
    // e.g. a customer/styler token only — the admin area must still gate them.
    window.sessionStorage.setItem(SESSION_KEY, "customer-jwt");
    renderAdminLogin();
    expect(screen.getByText("Admin Sign In")).toBeInTheDocument();
    expect(screen.queryByText("CATEGORIES_PAGE")).not.toBeInTheDocument();
  });
});