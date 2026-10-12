import { Link, Navigate, useLocation } from "react-router-dom";
import { isAdminOwner } from "./adminRole";
import { AdminPage, AdminCard } from "./adminShell";

/**
 * What a manager sees on an owner-only admin page opened directly (a bookmark
 * or a shared link): a plain explanation instead of a screen that would fail
 * on every request.
 */
export function OwnerAccessNeeded() {
  return (
    <AdminPage eyebrow="Admin" title="Owner access needed">
      <AdminCard>
        <p className="text-sm text-gray-700">
          This page is only for owners of the admin console. Your manager account covers stylist
          verification, gallery and review moderation, support tickets, feedback and viewing bookings.
        </p>
        <p className="mt-2 text-sm text-gray-700">If you need something here, ask an owner to do it or to change your role.</p>
        <Link to="/admin" className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white">Back to the dashboard</Link>
      </AdminCard>
    </AdminPage>
  );
}

/**
 * Renders an owner-only page for owners, and the explanation above for
 * managers. `managerTo(searchParams)` may name a page a manager is sent to
 * instead (Payments' Bookings tab opens the read-only bookings page).
 */
export function OwnerOnly({ children, managerTo }) {
  const { search } = useLocation();
  if (isAdminOwner()) return children;
  const elsewhere = managerTo && managerTo(new URLSearchParams(search));
  return elsewhere ? <Navigate to={elsewhere} replace /> : <OwnerAccessNeeded />;
}
