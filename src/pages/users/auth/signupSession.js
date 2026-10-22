/**
 * The customer sign-up session in the browser. After step 1 the server hands
 * back an opaque sign-up token; the later steps send that token instead of the
 * email address, so the address is typed once and never kept in browser storage.
 */
const TOKEN_KEY = "signupToken";
const LEGACY_EMAIL_KEY = "signupEmail";

export const getSignupToken = (state) => {
  if (state?.signupToken) return state.signupToken;
  try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
};

export const saveSignupToken = (token) => {
  if (!token) return;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(LEGACY_EMAIL_KEY);
  } catch { /* private mode: the token still travels in router state */ }
};

export const clearSignupSession = () => {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(LEGACY_EMAIL_KEY);
  } catch { /* nothing to clear */ }
};
