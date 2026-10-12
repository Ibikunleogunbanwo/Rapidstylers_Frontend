import { Navigate } from "react-router-dom";
import { getAuthToken, isAdminRole } from "../../utils/constant";
import { isAdminOwner } from "./adminRole";
import { AdminPage } from "./adminShell";
import AdminBookings from "./adminBookings";

/**
 * Bookings on their own page, for managers: the read-only list and booking
 * detail without the rest of Payments. Owners keep the Bookings tab inside
 * Payments, where a row's Refund action fills in the refund form.
 */
export default function BookingsPage() {
  if (!getAuthToken() || !isAdminRole()) return <Navigate to="/admin/login" replace />;
  if (isAdminOwner()) return <Navigate to="/admin/payments?section=bookings" replace />;
  return (
    <AdminPage eyebrow="Admin" title="Bookings">
      <AdminBookings />
    </AdminPage>
  );
}
