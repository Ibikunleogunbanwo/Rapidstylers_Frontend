import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { APIService } from "../../hooks/remote/apiService";
import { setUserSession, getUserDetails } from "../../hooks/local/userReducer";
import { getAuthToken, setAuthToken, setRefreshToken, setUserRole, setAdminRole, showSuccessToastMessage } from "../../utils/constant";
import logo from "../../assets/svg-icons/colouredLogo.svg";
import InputWithLabel from "../../components/inputWithLabel";
import PasswordInput from "../../components/passwordInput";
import Buttons from "../../components/button";
import GoogleSignInButton from "../../components/googleSignInButton";

// Google Sign-In client id (public). Empty disables the Google button + divider.
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

/**
 * Unified login for all three roles. The backend /sign_in endpoint detects
 * whether the credentials belong to an admin, stylist or customer and returns
 * the role with a role-scoped JWT; this page routes to the matching area.
 * "Continue with Google" is customer-only and hidden unless a client id is
 * configured.
 */
const Login = () => {
  document.title = "Sign In | RapidStylers";
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const routeByRole = (role) => {
    if (role === "ADMIN") return "/admin/categories";
    if (role === "STYLER") return "/styler-dashboard";
    return "/dashboard";
  };

  const completeAuth = async (res) => {
    const token = res.data?.token;
    const refreshToken = res.data?.refreshToken;
    const role = res.data?.data?.role;
    const account = res.data?.data?.account;
    if (token) {
      setAuthToken(token);
      if (refreshToken) {
        setRefreshToken(refreshToken);
      }
      // Persist the role so route guards and the header/footer know which area
      // this session belongs to (stylers/admins get no userSessionData).
      if (role) {
        setUserRole(role);
      }
      if (role === "ADMIN") {
        setAdminRole();
      }
      if (role === "CUSTOMER" && account) {
        // Persist the session (store + localStorage) so the dashboard guard
        // passes without a reload, then fetch the full profile in the
        // background — same behavior as the hero-section login path.
        dispatch(setUserSession(res.data));
        dispatch(getUserDetails(account.userId));
      }
      showSuccessToastMessage(
        role === "ADMIN" ? "Welcome, admin" : "Welcome back"
      );
      navigate(routeByRole(role));
    } else {
      setErrorMsg("Sign in did not return a session. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await APIService.signIn({ emailAddress, password });
      await completeAuth(res);
    } catch (error) {
      // Error toasts are handled in APIService; also show inline
      const msg = error?.response?.data?.message || error?.message || "Sign in failed";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  if (getAuthToken()) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left panel */}
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block relative">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white px-10">
          <div className="max-w-md text-center">
            <p className="text-4xl font-bold font-serif leading-tight">
              Welcome back to{" "}
              <span className="text-brand">RapidStylers</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full">
            <div className="mb-6">
              <Link to="/">
                <img src={logo} alt="" className="h-10" />
              </Link>
            </div>
            <p className="text-2xl font-bold text-gray-900">Welcome back</p>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="mt-6">
                  <GoogleSignInButton onSuccess={completeAuth} onError={setErrorMsg} />
                </div>
                <div className="flex items-center gap-3 my-4">
                  <span className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
                  <span className="flex-1 border-t border-gray-200" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <InputWithLabel
                labelName={"Email address"}
                inputType={"email"}
                inputName={"emailAddress"}
                inputValue={emailAddress}
                inputOnChange={(e) => setEmailAddress(e.target.value)}
                placeholder={"you@example.com"}
              />
              <PasswordInput
                labelName={"Password"}
                inputType={"password"}
                inputName={"password"}
                inputValue={password}
                inputOnChange={(e) => setPassword(e.target.value)}
                placeholder={"Enter your password"}
              />
              <Buttons
                btnType={"primary"}
                type={"submit"}
                btnText={loading ? "Signing in..." : "Sign In"}
              />
            </form>

            {errorMsg && (
              <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-2 text-sm">
              <p>
                Don't have an account?{" "}
                <Link to="/?signup=1" className="text-brand underline font-semibold">
                  Create account
                </Link>
              </p>
              <Link to="/" className="text-gray-500 hover:text-gray-800 font-semibold">
                ← Home
              </Link>
            </div>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
