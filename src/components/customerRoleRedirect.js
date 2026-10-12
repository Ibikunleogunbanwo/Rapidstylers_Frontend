import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";
import { getAuthToken, getUserRole } from "../utils/constant";

const MESSAGES = {
  professionals: "That page is for professionals. Here is your customer dashboard.",
  admin: "That page is for the RapidStylers team. Here is your customer dashboard.",
};

/**
 * Wraps the stylist and admin areas. A signed-in customer who opens one of
 * them goes to their own dashboard with a short note. Before this, the area's
 * own guard sent them to /login, which (already signed in) bounced back and
 * left a blank page. Everyone else passes through to the area's own guard.
 */
const CustomerRoleRedirect = ({ area = "professionals", children }) => {
  const isCustomer = Boolean(getAuthToken()) && getUserRole() === "CUSTOMER";
  useEffect(() => {
    if (isCustomer) toast.info(MESSAGES[area] || MESSAGES.professionals, { toastId: `rs-role-redirect:${area}` });
  }, [isCustomer, area]);
  if (isCustomer) return <Navigate to="/dashboard" replace />;
  return children ?? <Outlet />;
};

export default CustomerRoleRedirect;
