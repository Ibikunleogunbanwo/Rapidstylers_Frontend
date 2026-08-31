import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { userLogOut } from "../hooks/local/userReducer";
import { getAuthToken, getUserRole, isAdminRole } from "../utils/constant";

// Role-based inactivity windows (ms) before a session is automatically ended.
// Admins get the shortest window (sensitive area), stylers mid, customers the
// longest — the industry-standard ordering for an app with privileged roles.
export const IDLE_TIMEOUT_MS = {
  ADMIN: 15 * 60 * 1000,   // 15 min
  STYLER: 30 * 60 * 1000,  // 30 min
  CUSTOMER: 60 * 60 * 1000 // 60 min
};

const DEFAULT_IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MS.CUSTOMER;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
  "scroll"
];

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

  const role = getUserRole() || (isAdminRole() ? "ADMIN" : "");
  const idleMs = IDLE_TIMEOUT_MS[role] || DEFAULT_IDLE_TIMEOUT_MS;

  const signOut = useCallback(() => {
    if (signedOutRef.current) return;
    signedOutRef.current = true;
    // Fire-and-forget revoke + teardown; logOutSession catches its own errors.
    dispatch(userLogOut());
    const target = role === "ADMIN" ? "/admin/login" : "/login";
    navigate(target, { replace: true });
  }, [role, dispatch, navigate]);

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
      if (Date.now() - lastActivityRef.current >= idleMs) {
        signOut();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, bump));
      clearInterval(checkInterval);
    };
  }, [idleMs, signOut]);

  return null;
}