import { toast } from "react-toastify";
import {
  showSuccessToastMessage,
  showErrorToastMessage,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  AUTH_TOKEN_STORAGE_KEY,
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
    expect(toast.success).toHaveBeenCalledWith("It worked", expect.anything());
  });

  test("showSuccessToastMessage passes autoClose of 4000", () => {
    showSuccessToastMessage("Saved");
    const options = toast.success.mock.calls[0][1];
    expect(options.autoClose).toBe(4000);
  });

  test("showSuccessToastMessage passes colored theme", () => {
    showSuccessToastMessage("Saved");
    const options = toast.success.mock.calls[0][1];
    expect(options.theme).toBe("colored");
  });

  test("showSuccessToastMessage enables progress bar", () => {
    showSuccessToastMessage("Saved");
    const options = toast.success.mock.calls[0][1];
    expect(options.hideProgressBar).toBe(false);
  });

  test("showSuccessToastMessage enables pauseOnHover", () => {
    showSuccessToastMessage("Saved");
    const options = toast.success.mock.calls[0][1];
    expect(options.pauseOnHover).toBe(true);
  });

  test("showSuccessToastMessage enables closeOnClick", () => {
    showSuccessToastMessage("Saved");
    const options = toast.success.mock.calls[0][1];
    expect(options.closeOnClick).toBe(true);
  });

  test("showSuccessToastMessage enables draggable", () => {
    showSuccessToastMessage("Saved");
    const options = toast.success.mock.calls[0][1];
    expect(options.draggable).toBe(true);
  });

  test("showErrorToastMessage calls toast.error with the message", () => {
    showErrorToastMessage("Something broke");
    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith("Something broke", expect.anything());
  });

  test("showErrorToastMessage passes autoClose of 5000", () => {
    showErrorToastMessage("Fail");
    const options = toast.error.mock.calls[0][1];
    expect(options.autoClose).toBe(5000);
  });

  test("showErrorToastMessage passes colored theme", () => {
    showErrorToastMessage("Fail");
    const options = toast.error.mock.calls[0][1];
    expect(options.theme).toBe("colored");
  });

  test("showErrorToastMessage enables progress bar", () => {
    showErrorToastMessage("Fail");
    const options = toast.error.mock.calls[0][1];
    expect(options.hideProgressBar).toBe(false);
  });

  test("showErrorToastMessage enables pauseOnHover", () => {
    showErrorToastMessage("Fail");
    const options = toast.error.mock.calls[0][1];
    expect(options.pauseOnHover).toBe(true);
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
});
