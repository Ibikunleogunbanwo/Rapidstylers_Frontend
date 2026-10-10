/**
 * The stylist sign-up upload pass.
 *
 * A new stylist uploads their profile and ID photos before their account
 * exists, so they have no sign-in token to show the backend. Verifying the
 * email code hands out this short-lived pass instead: it lets the browser ask
 * for an upload signature and nothing else. It lives for the tab only, and is
 * dropped once the account is created.
 */
export const SIGNUP_UPLOAD_PASS_KEY = "stylerSignupUploadPass";

export const saveSignupUploadPass = (pass) => {
  if (!pass) return;
  try {
    sessionStorage.setItem(SIGNUP_UPLOAD_PASS_KEY, pass);
  } catch {
    // Storage unavailable (private mode): the upload will ask the user to verify again.
  }
};

export const readSignupUploadPass = () => {
  try {
    return sessionStorage.getItem(SIGNUP_UPLOAD_PASS_KEY) || "";
  } catch {
    return "";
  }
};

export const clearSignupUploadPass = () => {
  try {
    sessionStorage.removeItem(SIGNUP_UPLOAD_PASS_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
};
