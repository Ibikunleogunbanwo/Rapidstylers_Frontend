import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../../hooks/local/userReducer";
import Login from "./login";

// Stub the Google button (it loads a live script) and any reducer work.
jest.mock("../../components/googleSignInButton", () => {
  const MockGoogle = () => null;
  return MockGoogle;
});

jest.mock("../../hooks/local/userReducer", () => {
  const actual = jest.requireActual("../../hooks/local/userReducer");
  return {
    ...actual,
    // The slice reducer is fine; the async thunks trigger no network here.
  };
});

jest.mock("../../hooks/remote/apiService", () => {
  const APIService = { signIn: jest.fn() };
  return { APIService };
});

const store = configureStore({ reducer: { user: userReducer } });

function LocationProbe() {
  const location = useLocation();
  // record where the router actually ended up
  window.__locationAfterRender = location.pathname;
  return null;
}

const renderLogin = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe("Login signed-in redirect guard", () => {
  const SESSION_KEY = "rapidstylers_auth_token";
  const ROLE_KEY = "rapidstylers_user_role";

  beforeEach(() => {
    window.__locationAfterRender = "";
    window.sessionStorage.clear();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("redirects an already-signed-in customer to /dashboard, not home", () => {
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token-CUSTOMER");
    window.sessionStorage.setItem(ROLE_KEY, "CUSTOMER");
    renderLogin();
    expect(window.__locationAfterRender).toBe("/dashboard");
  });

  it("redirects an already-signed-in styler to /styler-dashboard", () => {
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token-STYLER");
    window.sessionStorage.setItem(ROLE_KEY, "STYLER");
    renderLogin();
    expect(window.__locationAfterRender).toBe("/styler-dashboard");
  });

  it("redirects an already-signed-in admin to /admin/categories", () => {
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token-ADMIN");
    window.sessionStorage.setItem(ROLE_KEY, "ADMIN");
    renderLogin();
    expect(window.__locationAfterRender).toBe("/admin/categories");
  });

  it("defaults a token with no persisted role to the customer dashboard", () => {
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token");
    // no role key — falls through routeByRole default
    renderLogin();
    expect(window.__locationAfterRender).toBe("/dashboard");
  });

  it("does not redirect a signed-out visitor — renders the login form", () => {
    renderLogin();
    // No token -> no Navigate -> form visible
    expect(window.__locationAfterRender).toBe("");
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("a customer who signs in lands on /dashboard (not home), even when the auth re-render races the token write", () => {
    // Simulates the race that used to send users home: the token lands in
    // sessionStorage (setAuthToken inside completeAuth) and the component
    // re-renders BEFORE navigate('/dashboard') is reached. The guard must now
    // route by role to the dashboard, never "/".
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token-CUSTOMER");
    window.sessionStorage.setItem(ROLE_KEY, "CUSTOMER");
    renderLogin();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("jwt-token-CUSTOMER");
    expect(window.__locationAfterRender).toBe("/dashboard");
  });

  it("a stored intended route wins in the signed-in guard, returning the visitor there instead of the default dashboard", () => {
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token-CUSTOMER");
    window.sessionStorage.setItem(ROLE_KEY, "CUSTOMER");
    window.sessionStorage.setItem("rapidstylers_intended_route", "/savedStylist");
    renderLogin();
    expect(window.__locationAfterRender).toBe("/savedStylist");
    // Consumed after use so it can't re-apply on the next visit.
    expect(window.sessionStorage.getItem("rapidstylers_intended_route")).toBeNull();
  });

  it("the intended route survives the auth re-render race and still returns the visitor there", () => {
    // A customer on /search clicks Login (intended stored), signs in; the token
    // write re-renders before completeAuth's navigate runs. The guard honors the
    // stored route so they land back on /search, not the dashboard.
    window.sessionStorage.setItem(SESSION_KEY, "jwt-token-CUSTOMER");
    window.sessionStorage.setItem(ROLE_KEY, "CUSTOMER");
    window.sessionStorage.setItem("rapidstylers_intended_route", "/search?province=Alberta&city=Calgary");
    renderLogin();
    expect(window.__locationAfterRender).toBe("/search");
    expect(window.sessionStorage.getItem("rapidstylers_intended_route")).toBeNull();
  });
});