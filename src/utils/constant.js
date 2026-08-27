import { useEffect } from "react";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
// Secrets come from the local .env file (gitignored) via CRA's REACT_APP_ vars.
// Copy .env.example to .env and fill in real values.
export const API_KEY = process.env.REACT_APP_API_KEY || "";
export const JSON_CONTENT_TYPE = "application/json";
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://localhost:9090/rapid_stylers";

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
export const clearAuthToken = () => sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);

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
    toast.success(successMessage);
    return null;
}

// Stripe Connect disabled reasons look like "rejected.other" / "requirements.past_due" —
// turn them into plain words for UI banners (Payouts page, dashboard card).
export const humanizeConnectReason = (reason) => {
  if (!reason) return "Your payout account could not be verified by Stripe.";
  const cleaned = String(reason).replace(/[._]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export const showErrorToastMessage  = (errorMessage)=>{
    toast.error(errorMessage);
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


