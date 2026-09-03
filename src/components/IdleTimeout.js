import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { userLogOut } from "../hooks/local/userReducer";
import { getAuthToken, getUserRole, isAdminRole } from "../utils/constant";

// Role-based inactivity windows (ms) before a session is automatically ended.
// Kept in lockstep with the backend SESSION_IDLE_*_MINUTES values — the backend
// is the enforcement of record (it revokes the refresh-token family at
// /auth/refresh), so these windows must match the server's, never be shorter.
export const IDLE_TIMEOUT_MS = {
  ADMIN: 30 * 60 * 1000,   // 30 min — matches SESSION_IDLE_ADMIN_MINUTES
  STYLER: 30 * 60 * 1000,  // 30 min — matches SESSION_IDLE_STYLER_MINUTES
  CUSTOMER: 60 * 60 * 1000 // 60 min — matches SESSION_IDLE_CUSTOMER_MINUTES
};

const DEFAULT_IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MS.CUSTOMER;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel"
  // NOTE: "scroll" is deliberately excluded — programmatic scrolling from
  // carousels / auto-scrolling containers fires scroll events with no user
  // input, which would silently keep the session alive forever.
];

// Role is read from sessionStorage LIVE (each check / sign-out), never captured
// at mount: the app usually loads signed-out, so a component that snapshots the
// role at first render would apply the 60-min default to every session and
// always redirect to /login, even for admins and stylers who sign in later.
const readRole = () => getUserRole() || (isAdminRole() ? "ADMIN" : "");

/**
 * Auto signs a user out after a role-specific period of inactivity. On timeout it
 * calls the canonical userLogOut thunk — which POSTs the refresh token to
 * /auth/logout so the backend revokes it server-side — then redirects to the
 * correct login page. Rendered once at the app root; it reads the token/role live
 * so it applies across customer, styler and admin areas regardless of mount order.
 */
export default function IdleTimeout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const lastActivityRef = useRef(Date.now());
  const signedOutRef = useRef(false);

  const signOut = useCallback(() => {
    if (signedOutRef.current) return;
    signedOutRef.current = true;
    // Fire-and-forget revoke + teardown; logOutSession catches its own errors.
    dispatch(userLogOut());
    // Role read live so a session that signed in after mount still redirects
    // to the right login page.
    const target = readRole() === "ADMIN" ? "/admin/login" : "/login";
    toast.info("You've been signed out due to inactivity.", { autoClose: 5000 });
    navigate(target, { replace: true });
  }, [dispatch, navigate]);

  useEffect(() => {
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, bump, { passive: true })
    );

    const checkInterval = setInterval(() => {
      // Only honor the timeout while a real session token exists. If there is no
      // token (signed out or never in), keep the clock fresh so a later login
      // starts with a full idle window and doesn't inherit stale inactivity.
      if (!getAuthToken()) {
        lastActivityRef.current = Date.now();
        signedOutRef.current = false;
        return;
      }
      // Role is resolved on every tick so the correct window applies even when
      // the user signed in after this component mounted.
      const idleMs = IDLE_TIMEOUT_MS[readRole()] || DEFAULT_IDLE_TIMEOUT_MS;
      if (Date.now() - lastActivityRef.current >= idleMs) {
        signOut();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, bump));
      clearInterval(checkInterval);
    };
  }, [signOut]);

  return null;
}