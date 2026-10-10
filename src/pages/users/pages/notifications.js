import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage } from "../../../utils/constant";

const Notifications = ({ setPageTitle }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingReads, setPendingReads] = useState(new Set());
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    if (!getAuthToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      const response = await APIService.listNotifications();
      if (!Array.isArray(response.data?.data?.items)) throw new Error("Invalid notifications");
      setItems(response.data.data.items);
    } catch (error) {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPageTitle("Account Settings");
    document.title = "Notifications | RapidStylers";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = async (notification) => {
    if (notification.read || markingAll || pendingReads.has(notification.id)) return;
    setPendingReads((current) => new Set(current).add(notification.id));
    try {
      await APIService.markNotificationRead(notification.id);
      setItems((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch (error) {
      showErrorToastMessage("Unable to update notification");
    } finally {
      setPendingReads((current) => { const next = new Set(current); next.delete(notification.id); return next; });
    }
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await APIService.markAllNotificationsRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
    } catch (error) {
      showErrorToastMessage("Unable to update notifications");
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Notifications</h1>
            <p className="mt-0.5 text-xs text-gray-500">In-app updates from RapidStylers</p>
          </div>
        </div>
        {unread > 0 && <button type="button" onClick={markAllRead} disabled={markingAll || pendingReads.size > 0} className="text-xs font-semibold text-brand disabled:opacity-50">{markingAll ? "Updating..." : "Mark all read"}</button>}
      </div>
      <div className="p-4">
        {!getAuthToken() ? (
          <p className="text-sm text-gray-500">Please sign in to view notifications.</p>
        ) : loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading notifications...</p>
        ) : loadError ? (
          <div role="alert">Unable to load notifications. <button type="button" onClick={load}>Retry</button></div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">You have no notifications yet.</p>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <button key={item.id} type="button" onClick={() => markRead(item)} disabled={markingAll || pendingReads.has(item.id)} aria-busy={pendingReads.has(item.id)} className={`w-full rounded-lg border p-4 text-left transition hover:border-brand/30 ${item.read ? "border-gray-100 bg-white" : "border-brand/20 bg-brand/[0.04]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-bold text-gray-900">{item.title}</p><p className="mt-1 text-sm leading-5 text-gray-600">{item.message}</p></div>
                  {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                </div>
                <p className="mt-2 text-[11px] text-gray-400">{item.createdAt}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
