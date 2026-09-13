import { useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
// Secrets come from the local .env file (gitignored) via CRA's REACT_APP_ vars.
// Copy .env.example to .env and fill in real values.
export const API_KEY = process.env.REACT_APP_API_KEY || "";
export const JSON_CONTENT_TYPE = "application/json";
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://localhost:9090/rapid_stylers";

/**
 * The support address we publish. It appears on the support page, in the terms,
 * in the privacy policy and in the footer, and it used to be retyped in each of
 * those places — which is how the footer ended up advertising
 * `contact@rapidstylers.com`, a domain we do not own. Reference this instead of
 * typing an address, and there is only one value to get right.
 */
export const SUPPORT_EMAIL = "support@rapidstylers.ca";

/**
 * The real contact details we publish in the footer. Until these were provided
 * the footer deliberately printed nothing there, after an invented street
 * address and a non-existent phone number had shipped. Like SUPPORT_EMAIL,
 * reference these constants rather than retyping them.
 */
export const SUPPORT_ADDRESS = "Carrington, Northwest Calgary, Alberta";
export const SUPPORT_PHONE = "+1 (639) 384-0942";
/** Machine-readable form of SUPPORT_PHONE for `tel:` links. */
export const SUPPORT_PHONE_TEL = "+16393840942";

// Stripe publishable key (frontend) — collect cards inside Stripe's Elements
// iframe. REACT_APP_STRIPE_MODE ("test" or "live") picks the matching key set
// and ONLY that set (never the other mode). An empty mode falls back to the
// legacy REACT_APP_STRIPE_PUBLISHABLE_KEY. Empty until Stripe keys are added.
export const STRIPE_PUBLISHABLE_KEY =
  process.env.REACT_APP_STRIPE_MODE === "live"
    ? process.env.REACT_APP_STRIPE_LIVE_PUBLISHABLE_KEY || ""
    : process.env.REACT_APP_STRIPE_MODE === "test"
    ? process.env.REACT_APP_STRIPE_TEST_PUBLISHABLE_KEY || ""
    : process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

export const API_HEADER = {
    'Content-Type' : JSON_CONTENT_TYPE,
    'x-api-key' : API_KEY
}

// JWT issued by user_sign_in / styler_sign_in / admin_sign_in — attached as
// Authorization: Bearer <token> by the ApiClient interceptor.
export const AUTH_TOKEN_STORAGE_KEY = "rapidstylers_auth_token";
export const ADMIN_ROLE_KEY = "rapidstylers_admin_role";
export const getAuthToken = () => sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
export const setAuthToken = (token) => sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);

// Role of the signed-in user (CUSTOMER / STYLER / ADMIN), persisted at login so
// the header/footer and route guards can tell which area a session belongs to.
// Unlike ADMIN_ROLE_KEY this covers every role, not just admins.
export const USER_ROLE_STORAGE_KEY = "rapidstylers_user_role";
export const getUserRole = () => sessionStorage.getItem(USER_ROLE_STORAGE_KEY) || "";
export const setUserRole = (role) => sessionStorage.setItem(USER_ROLE_STORAGE_KEY, role);
export const clearUserRole = () => sessionStorage.removeItem(USER_ROLE_STORAGE_KEY);

// Page a signed-out user was about to use (path + query). Stored when we bounce
// them to /login so we can return them there after a successful sign-in instead
// of always dumping them on the dashboard. SESSION-scoped; cleared on logout.
export const INTENDED_ROUTE_KEY = "rapidstylers_intended_route";
export const getIntendedRoute = () => sessionStorage.getItem(INTENDED_ROUTE_KEY) || "";
export const setIntendedRoute = (route) => sessionStorage.setItem(INTENDED_ROUTE_KEY, route);
export const clearIntendedRoute = () => sessionStorage.removeItem(INTENDED_ROUTE_KEY);

// User-picked location (lat/lng/city/province) persists in localStorage so it
// survives reloads while logged in, but it is SESSION-scoped: on logout OR a
// token timeout it must be dropped so the next login re-detects from the
// browser/IP instead of reusing a stale position.
export const SAVED_LOCATION_KEY = "userLocation";

/** Clears the saved location and tells LocationProvider to reset and re-detect. */
export const clearSavedUserLocation = () => {
  try {
    localStorage.removeItem(SAVED_LOCATION_KEY);
  } catch (_) {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rapidstylers:location-reset"));
  }
};

export const clearAuthToken = () => {
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearSavedUserLocation();
};

/**
 * Full session teardown for logout paths: access token, refresh token, admin
 * flag, user role and the saved location. Without clearing the refresh token
 * the ApiClient 401 auto-refresh silently resurrects the session after
 * sign-out, and stale role flags leave the header showing a signed-in user.
 */
export const clearAllSessionTokens = () => {
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(ADMIN_ROLE_KEY);
  sessionStorage.removeItem(USER_ROLE_STORAGE_KEY);
  clearIntendedRoute();
  clearSavedUserLocation();
};

// Refresh token — stored in sessionStorage alongside the access token.
// Backend issues a new one on every /auth/refresh call (rotation).
const REFRESH_TOKEN_STORAGE_KEY = "rapidstylers_refresh_token";
export const getRefreshToken = () => sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || "";
export const setRefreshToken = (token) => sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
export const clearRefreshToken = () => sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);

export const isAdminRole = () => sessionStorage.getItem(ADMIN_ROLE_KEY) === "admin";
export const setAdminRole = () => sessionStorage.setItem(ADMIN_ROLE_KEY, "admin");
export const clearAdminRole = () => sessionStorage.removeItem(ADMIN_ROLE_KEY);

export const FORM_DATA_HEADER = {
    'x-api-key' : API_KEY,
    'Content-Type': 'multipart/form-data',
}

export const showSuccessToastMessage  = (successMessage)=>{
    // Same reasoning as the error helper below: identical messages replace the
    // toast already on screen instead of stacking a copy under it.
    toast.success(successMessage, { toastId: `rs-success:${successMessage}` });
    return null;
}

// Stripe Connect disabled reasons look like "rejected.other" / "requirements.past_due" —
// turn them into plain words for UI banners (Payouts page, dashboard card).
export const humanizeConnectReason = (reason) => {
  if (!reason) return "Your payout account could not be verified by Stripe.";
  const cleaned = String(reason).replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

/**
 * Reports a failure once, however many callers hit it.
 *
 * A single backend outage used to stack up to six identical toasts on the home
 * page, because the toast is raised per failed request and the same request is
 * made more than once: three components ask for the service list independently
 * (the hero, its search and the featured carousel), and React StrictMode runs
 * each mount effect twice in development.
 *
 * Reusing the message as the toast id makes the library REPLACE the toast it is
 * already showing rather than add another, and a dismissal clears the id so the
 * next genuine failure still shows. Deduping here rather than at the call sites
 * means every endpoint gets it.
 */
export const showErrorToastMessage  = (errorMessage)=>{
    toast.error(errorMessage, { toastId: `rs-error:${errorMessage}` });
    return null;
}

/**
 * The wire format for appointment times is canonical 24-hour HH:mm (aligned
 * with the availability API). This renders it as a friendly 12-hour clock time
 * for customer-facing UIs; values already in 12-hour form (legacy rows) pass
 * through unchanged.
 */
export const formatTime12 = (value) => {
  if (!value) return value || "";
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec(String(value).trim());
  if (!m) return value;
  const hasMeridiem = m[3];
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  if (hasMeridiem) {
    if (hasMeridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
    if (hasMeridiem.toLowerCase() === "am" && hour === 12) hour = 0;
  }
  const meridiem = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

export const showSuccessMessageReload = (successMessage)=>{
    toast.success(successMessage, 
    {
        onClose: () => {
            setTimeout(() => {
                window.location.reload();
            }, 6000)
        }
    }
    );
    return null;
}

export const retrieveFromLocalStorage = (keys) =>{
    const data = {};
    keys.forEach((key)=>{
        const persistedState = localStorage.getItem(key);
        data[key] = persistedState ? JSON.parse(persistedState) : null;
    });
    return data;
}
export function useDigitInput() {
    useEffect(() => {
      const handleDigitInput = (event) => {
        const removeString = event.target.value.replace(/[^0-9.]/g, '');
        const convertToDigit = parseFloat(removeString);
        if (!isNaN(convertToDigit)) {
          event.target.value = convertToDigit;
        } else {
          event.target.value = '';
        }
      };      const inputs = document.querySelectorAll('.digitFormat');
      inputs.forEach((input) => {
        input.addEventListener('keyup', handleDigitInput);
      });

      return () => {
        inputs.forEach((input) => {
          input.removeEventListener('keyup', handleDigitInput);
        });
      };
    }, []);
  }


