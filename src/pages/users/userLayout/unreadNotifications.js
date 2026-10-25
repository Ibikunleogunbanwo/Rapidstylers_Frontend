import { useEffect, useState } from "react";
import { ApiClient } from "../../../hooks/remote/apiClient";
import { getAuthToken } from "../../../utils/constant";

// The Notifications page announces changes (read, delete, clear) with this
// event so the sidebar badge follows without another request.
export const UNREAD_NOTIFICATIONS_EVENT = "rapidstylers:unread-notifications";
export const announceUnreadNotifications = (count) =>
  window.dispatchEvent(new CustomEvent(UNREAD_NOTIFICATIONS_EVENT, { detail: { count } }));

/**
 * Unread notification count for the sidebar badge. Read from /notifications
 * (which carries unreadCount), or the stylist's /styler/notifications, through
 * the bare client: a badge that cannot load just stays hidden, it must never
 * raise an error toast on every page.
 */
export const useUnreadNotifications = (refreshKey, path = "/notifications") => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // No path: nothing to read (the stylist shell passes none until it knows the role).
    if (!getAuthToken() || !path) return undefined;
    let current = true;
    ApiClient.get(path)
      .then((response) => {
        const data = response?.data?.data;
        const unread = typeof data?.unreadCount === "number"
          ? data.unreadCount
          : Array.isArray(data?.items) ? data.items.filter((item) => !item.read).length : 0;
        if (current) setCount(unread);
      })
      .catch(() => {});
    return () => { current = false; };
  }, [refreshKey, path]);
  useEffect(() => {
    const onChange = (event) => setCount(Number(event.detail?.count) || 0);
    window.addEventListener(UNREAD_NOTIFICATIONS_EVENT, onChange);
    return () => window.removeEventListener(UNREAD_NOTIFICATIONS_EVENT, onChange);
  }, []);
  return count;
};

// The Quotes page announces its waiting count with this event after a change.
export const QUOTES_WAITING_EVENT = "rapidstylers:quotes-waiting";
export const announceQuotesWaiting = (count) =>
  window.dispatchEvent(new CustomEvent(QUOTES_WAITING_EVENT, { detail: { count } }));

/**
 * How many quote requests wait on the stylist: unpriced, or with a client
 * message unanswered. Read like the unread count, and silent on failure.
 */
export const useQuotesWaiting = (refreshKey, enabled) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!getAuthToken() || !enabled) return undefined;
    let current = true;
    ApiClient.get("/styler/quotes")
      .then((response) => {
        const waiting = Number(response?.data?.data?.waiting);
        if (current) setCount(Number.isFinite(waiting) ? waiting : 0);
      })
      .catch(() => {});
    return () => { current = false; };
  }, [refreshKey, enabled]);
  useEffect(() => {
    const onChange = (event) => setCount(Number(event.detail?.count) || 0);
    window.addEventListener(QUOTES_WAITING_EVENT, onChange);
    return () => window.removeEventListener(QUOTES_WAITING_EVENT, onChange);
  }, []);
  return count;
};
