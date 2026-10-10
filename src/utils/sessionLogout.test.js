import { logoutSession } from "./sessionLogout";
import { APIService } from "../hooks/remote/apiService";
import { getAuthToken, getRefreshToken, getUserRole, getSessionRevision, setAuthToken, setRefreshToken, setUserRole } from "./constant";

vi.mock("../hooks/remote/apiService", () => ({ APIService: { logout: vi.fn(), stylerSignOut: vi.fn() } }));

afterEach(() => { sessionStorage.clear(); localStorage.clear(); vi.clearAllMocks(); });

test("session-reset observers see account storage and credentials already removed", () => {
  setAuthToken("jwt"); setRefreshToken("refresh"); setUserRole("CUSTOMER");
  localStorage.setItem("userSessionData", "old-account");
  localStorage.setItem("theme", "dark"); sessionStorage.setItem("preference", "large");
  const revision = getSessionRevision();
  let snapshot;
  const observe = () => { snapshot = {account: localStorage.getItem("userSessionData"), token: getAuthToken()}; };
  window.addEventListener("rapidstylers:location-reset", observe, {once: true});
  APIService.logout.mockRejectedValue(new Error("offline"));
  logoutSession();
  expect(snapshot).toEqual({account: null, token: ""});
  expect(getRefreshToken()).toBe(""); expect(getUserRole()).toBe("");
  expect(getSessionRevision()).toBeGreaterThan(revision);
  expect(localStorage.getItem("theme")).toBe("dark");
  expect(sessionStorage.getItem("preference")).toBe("large");
});

test("stylist offline notice still runs if revocation fails synchronously", () => {
  setAuthToken("jwt"); setRefreshToken("refresh"); setUserRole("STYLER");
  APIService.logout.mockImplementation(() => {throw new Error("offline");});
  logoutSession();
  expect(getAuthToken()).toBe(""); expect(getRefreshToken()).toBe("");
  expect(APIService.stylerSignOut).toHaveBeenCalledWith("jwt");
});
