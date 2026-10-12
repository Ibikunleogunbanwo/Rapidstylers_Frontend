import { isAdminOwner } from "../../utils/constant";

/**
 * Owner (ADMIN) versus manager (MANAGER) in the admin console. A manager does
 * the day-to-day work: stylist verification and ID photos, gallery and review
 * moderation, support tickets, feedback, the dashboard counts and read-only
 * bookings. Everything else (money, exports, marketing, content, catalog,
 * settings, the audit log and admin accounts) is for owners.
 *
 * This only decides what the website shows. The server refuses a manager on
 * every owner-only route whatever the page does.
 */
const ANY_SECTION = null;
const MANAGER_PAGES = {
  "/admin": ANY_SECTION,
  "/admin/stylers": ANY_SECTION,
  "/admin/bookings": ANY_SECTION,
  "/admin/operations": ["", "overview", "tickets", "reviews", "feedback"],
};

/** True when a manager may open this admin URL ("/admin/operations?section=tickets"). */
export const managerMayOpen = (to) => {
  const [path, query = ""] = String(to).split("?");
  if (!(path in MANAGER_PAGES)) return false;
  const sections = MANAGER_PAGES[path];
  if (sections === ANY_SECTION) return true;
  return sections.includes(new URLSearchParams(query).get("section") || "");
};

/** True when the signed-in admin may open this admin URL. */
export const canOpen = (to) => isAdminOwner() || managerMayOpen(to);

export { isAdminOwner };
