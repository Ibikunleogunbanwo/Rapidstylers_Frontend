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
});