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

  test("ADMIN is signed out to /admin/login after the shorter 15 min idle window", async () => {
    seedSession("ADMIN");
    renderIdle();
    expect(window.__idlePath).toBe("/dashboard");
    // Admin idle window is 15 min; staying under it keeps the session.
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
});