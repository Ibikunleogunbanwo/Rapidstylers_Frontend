import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUserSession, getUserDetails } from "./local/userReducer";
import { showSuccessToastMessage, showErrorToastMessage, setAuthToken, setRefreshToken } from "../utils/constant";

/**
 * "Sign up with Google": the backend creates the customer from the verified
 * id_token, so no email code, details or password steps are needed. Returns the
 * handler GoogleSignInButton calls on success.
 */
export const useGoogleSignup = ({ onDone } = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return async (res) => {
    const token = res.data?.token;
    const refreshToken = res.data?.refreshToken;
    const role = res.data?.data?.role;
    const account = res.data?.data?.account;
    if (!token) {
      showErrorToastMessage("Google sign up did not return a session. Please try again.");
      return;
    }
    setAuthToken(token);
    if (refreshToken) setRefreshToken(refreshToken);
    if (role === "CUSTOMER" && account) {
      // Persist the session so the dashboard guard passes without a reload.
      dispatch(setUserSession(res.data));
      dispatch(getUserDetails(account.userId));
    }
    showSuccessToastMessage("Welcome to RapidStylers");
    onDone?.();
    if (role === "ADMIN") navigate("/admin/categories");
    else if (role === "STYLER") navigate("/styler-dashboard");
    else navigate("/dashboard");
  };
};
