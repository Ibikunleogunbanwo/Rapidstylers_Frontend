import { NotificationsInbox } from "../users/pages/notifications";
import { APIService } from "../../hooks/remote/apiService";

// The customer inbox, pointed at the professional's own notifications
// (/styler/notifications). The dashboard shell skips its H1 here because the
// inbox prints one, as on the Support page.
const STYLER_INBOX = {
  list: () => APIService.stylerNotifications(),
  markRead: (id) => APIService.stylerMarkNotificationRead(id),
  markAllRead: () => APIService.stylerMarkAllNotificationsRead(),
  remove: (id) => APIService.stylerDeleteNotification(id),
  removeAll: () => APIService.stylerDeleteAllNotifications(),
};
const noPageTitle = () => {};

const StylerNotifications = () => (
  <NotificationsInbox setPageTitle={noPageTitle} api={STYLER_INBOX} subtitle="Updates from RapidStylers about your business" />
);

export default StylerNotifications;
