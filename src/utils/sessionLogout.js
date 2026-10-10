import { APIService } from "../hooks/remote/apiService";
import { clearAllSessionTokens, getAuthToken, getRefreshToken, getUserRole } from "./constant";

/** End the browser session immediately; server notices must never delay logout. */
export const logoutSession = () => {
  const accessToken = getAuthToken();
  const refreshToken = getRefreshToken();
  const role = getUserRole();
  ["user", "userSessionData", "userDetailsData"].forEach((key) => localStorage.removeItem(key));
  clearAllSessionTokens();
  const bestEffort = (notice) => {
    try { Promise.resolve(notice()).catch(() => {}); } catch (_) {}
  };
  if (refreshToken) bestEffort(() => APIService.logout(refreshToken));
  if (role === "STYLER" && accessToken) bestEffort(() => APIService.stylerSignOut(accessToken));
};
