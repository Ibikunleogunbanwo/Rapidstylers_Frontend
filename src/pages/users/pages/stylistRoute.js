import { useSelector } from "react-redux";
import UserLayout from "../userLayout";
import Stylist from "./stylist";
import { getAuthToken, getUserRole } from "../../../utils/constant";

/**
 * /stylist/:stylerTypeId/:stylerTypeName is public, so visitors can browse a
 * service's professionals without an account. A signed-in customer reaches it
 * from Book an appointment, and for them it stays inside the dashboard (header,
 * sidebar, mobile menu) instead of dropping to a bare page.
 */
const StylistRoute = () => {
  const userSession = useSelector((state) => state.user.userSessionData);
  const signedInCustomer = Boolean(getAuthToken()) && getUserRole() === "CUSTOMER" && Boolean(userSession);
  return signedInCustomer ? <UserLayout /> : <Stylist />;
};

export default StylistRoute;
