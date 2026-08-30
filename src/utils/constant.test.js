import { toast } from "react-toastify";
import {
  showSuccessToastMessage,
  showErrorToastMessage,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  clearSavedUserLocation,
  AUTH_TOKEN_STORAGE_KEY,
  SAVED_LOCATION_KEY,
} from "./constant";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

jest.mock("react-toastify/dist/ReactToastify.css", () => {});

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
});

describe("Toast helpers", () => {
  test("showSuccessToastMessage calls toast.success with the message", () => {
    showSuccessToastMessage("It worked");
    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith("It worked");
  });

  test("showErrorToastMessage calls toast.error with the message", () => {
    showErrorToastMessage("Something broke");
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Something broke");
  });

  test("showSuccessToastMessage returns null", () => {
    const result = showSuccessToastMessage("ok");
    expect(result).toBeNull();
  });

  test("showErrorToastMessage returns null", () => {
    const result = showErrorToastMessage("fail");
    expect(result).toBeNull();
  });
});

describe("Auth token helpers", () => {
  test("setAuthToken stores token in sessionStorage", () => {
    setAuthToken("abc123");
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe("abc123");
  });

  test("getAuthToken retrieves stored token", () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "xyz789");
    expect(getAuthToken()).toBe("xyz789");
  });

  test("getAuthToken returns empty string when no token", () => {
    expect(getAuthToken()).toBe("");
  });

  test("clearAuthToken removes token from sessionStorage", () => {
    sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "to-delete");
    clearAuthToken();
    expect(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull();
  });

  test("logout / timeout clears the saved location so the next login re-detects", () => {
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ latitude: 1, longitude: 2 }));
    clearAuthToken();
    expect(localStorage.getItem(SAVED_LOCATION_KEY)).toBeNull();
  });

  test("clearSavedUserLocation removes the location and notifies re-detection", () => {
    const dispatched = jest.fn();
    window.addEventListener("rapidstylers:location-reset", dispatched);
    localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ latitude: 9, longitude: 9 }));

    clearSavedUserLocation();

    expect(localStorage.getItem(SAVED_LOCATION_KEY)).toBeNull();
    expect(dispatched).toHaveBeenCalledTimes(1);
    window.removeEventListener("rapidstylers:location-reset", dispatched);
  });
});
