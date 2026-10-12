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
 * (which carries unreadCount) through the bare client: a badge that cannot
 * load just stays hidden, it must never raise an error toast on every page.
 */
export const useUnreadNotifications = (refreshKey) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!getAuthToken()) return undefined;
    let current = true;
    ApiClient.get("/notifications")
      .then((response) => {
        const data = response?.data?.data;
        const unread = typeof data?.unreadCount === "number"
          ? data.unreadCount
          : Array.isArray(data?.items) ? data.items.filter((item) => !item.read).length : 0;
        if (current) setCount(unread);
      })
      .catch(() => {});
    return () => { current = false; };
  }, [refreshKey]);
  useEffect(() => {
    const onChange = (event) => setCount(Number(event.detail?.count) || 0);
    window.addEventListener(UNREAD_NOTIFICATIONS_EVENT, onChange);
    return () => window.removeEventListener(UNREAD_NOTIFICATIONS_EVENT, onChange);
  }, []);
  return count;
};
