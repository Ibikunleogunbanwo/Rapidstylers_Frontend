import { ApiClient } from "./apiClient";
import { setAuthToken, setRefreshToken } from "../../utils/constant";

/**
 * Account calls for a signed-in professional that the shared APIService does
 * not cover yet.
 */

/** The message to show for a failed request: field errors first, then the server's message. */
export const stylerAccountError = (error, fallback) => {
  const body = error?.response?.data;
  if (body?.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    const first = Object.values(body.data).find((value) => typeof value === "string");
    if (first) return first;
  }
  return body?.message || fallback;
};

/**
 * POST /update_styler_password {oldPassword, password, confirmPassword}.
 * The backend signs out every other device and hands this one a fresh token
 * pair, stored here exactly as the customer change-password flow stores it.
 * Resolves with the response body; a non-200 body or HTTP error rejects.
 */
export const updateStylerPassword = async ({ oldPassword, password, confirmPassword }) => {
  const response = await ApiClient.post("/update_styler_password", { oldPassword, password, confirmPassword });
  const body = response.data || {};
  if (String(body.statusCode) !== "200") {
    throw Object.assign(new Error(body.message || "Could not change your password."), { response: { data: body } });
  }
  if (body.token) {
    setAuthToken(body.token);
    if (body.refreshToken) setRefreshToken(body.refreshToken);
  }
  return body;
};
