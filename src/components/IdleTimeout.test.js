import React from "react";
import { render, act } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { userReducer } from "../hooks/local/userReducer";
import IdleTimeout, { IDLE_TIMEOUT_MS } from "./IdleTimeout";
import { AUTH_TOKEN_STORAGE_KEY, USER_ROLE_STORAGE_KEY } from "../utils/constant";

// The canonical logout thunk (userLogOut) revokes the refresh token through
// APIService.logout. Mock it so we can assert the revoke call fires.
jest.mock("../hooks/remote/apiService", () => {
  const APIService = { logout: jest.fn().mockResolvedValue({}) };
  return { APIService };
});
const { APIService } = require("../hooks/remote/apiService");

const REFRESH_KEY = "rapidstylers_refresh_token";

const store = configureStore({ reducer: { user: userReducer } });

function LocationProbe() {
  const location = useLocation();
  window.__idlePath = location.pathname;
  return null;
}

const renderIdle = () =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard"]}>
        <IdleTimeout />
        <LocationProbe />
      </MemoryRouter>
    </Provider>
  );

const advance = async (ms) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("IdleTimeout role-based session timeout", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sessionStorage.clear();
    window.__idlePath = "/dashboard";
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionStorage.clear();
  });

  const seedSession = (role) => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "access-token");
    sessionStorage.setItem(REFRESH_KEY, "refresh-token");
    sessionStorage.setItem(USER_ROLE_STORAGE_KEY, role);
  };

  test("CUSTOMER is signed out to /login after 60 min idle, revoking the refresh token", async () => {
    seedSession("CUSTOMER");
    renderIdle();
    // Activity keeps the session alive past the threshold.
    await advance(IDLE_TIMEOUT_MS.CUSTOMER - 1000);
    expect(window.__idlePath).toBe("/dashboard");
    // No activity for the full window now triggers the sign-out.
    await advance(2 * 30 * 1000);
    expect(window.__idlePath).toBe("/login");
    expect(APIService.logout).toHaveBeenCalledWith("refresh-token");
  });

  test("STYLER is signed out after 30 min idle", async () => {
    seedSession("STYLER");
    renderIdle();
    expect(window.__idlePath).toBe("/dashboard");
    await advance(IDLE_TIMEOUT_MS.STYLER + 30 * 1000);
    expect(window.__idlePath).toBe("/login");
  });

  test("ADMIN is signed out to /admin/login after the 30 min idle window", async () => {
    seedSession("ADMIN");
    renderIdle();
    expect(window.__idlePath).toBe("/dashboard");
    // Admin idle window is 30 min (aligned with the backend SESSION_IDLE_ADMIN_MINUTES);
    // staying under it keeps the session.
    await advance(IDLE_TIMEOUT_MS.ADMIN - 1000);
    expect(window.__idlePath).toBe("/dashboard");
    await advance(2 * 30 * 1000);
    expect(window.__idlePath).toBe("/admin/login");
  });

  test("no signed-in session never signs out, even after a long idle", async () => {
    renderIdle();
    await advance(60 * 60 * 1000);
    expect(window.__idlePath).toBe("/dashboard");
    expect(APIService.logout).not.toHaveBeenCalled();
  });

  test("role is read live after mount: signing in as ADMIN after load still gets the 30 min window and /admin/login", async () => {
    // The app is typically loaded signed-out, so the component mounts with no
    // role. A later login must be picked up on the next tick, not snapshotted.
    renderIdle();
    await advance(60 * 1000);
    seedSession("ADMIN");
    await advance(IDLE_TIMEOUT_MS.ADMIN - 1000);
    expect(window.__idlePath).toBe("/dashboard");
    await advance(2 * 30 * 1000);
    expect(window.__idlePath).toBe("/admin/login");
  });

  test("programmatic scroll does not count as activity (auto-scrolling carousels can't hold the session open)", async () => {
    seedSession("STYLER");
    renderIdle();
    await advance(IDLE_TIMEOUT_MS.STYLER - 30 * 1000);
    // A scroll event with no other input (e.g. an auto-scrolling carousel) must
    // not reset the idle clock.
    window.dispatchEvent(new Event("scroll"));
    await advance(2 * 30 * 1000);
    expect(window.__idlePath).toBe("/login");
  });

  test("real user input resets the idle clock", async () => {
    seedSession("STYLER");
    renderIdle();
    await advance(IDLE_TIMEOUT_MS.STYLER - 30 * 1000);
    window.dispatchEvent(new KeyboardEvent("keydown"));
    await advance(2 * 30 * 1000);
    expect(window.__idlePath).toBe("/dashboard");
    // ...but with no further input the window eventually elapses.
    await advance(IDLE_TIMEOUT_MS.STYLER);
    expect(window.__idlePath).toBe("/login");
  });
});