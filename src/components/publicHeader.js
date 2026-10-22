import logo from "../assets/svg-icons/logo.svg";
import React, { useState, useEffect } from "react";
import info from "../assets/svg-icons/info.svg";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "./button";
import InputWithLabel from "./inputWithLabel";
import { AccessibleModal } from "./accessibleDialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import Spinner from "./spinner";
import { useDispatch, useSelector } from "react-redux";
import { verifySignUpEmailAddress, userLogOut } from "../hooks/local/userReducer";
import LocationPicker from "./locationPicker";
import { useUserLocation } from "../context/LocationContext";
import { getAuthToken, getUserRole, setIntendedRoute, showErrorToastMessage } from "../utils/constant";
import { IS_DEMO, goToLiveSite } from "../utils/demo";
import GoogleSignInButton from "./googleSignInButton";
import { useGoogleSignup } from "../hooks/useGoogleSignup";

// Google Sign-In client id (public). When absent, the Google sign-up option is hidden.
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

/**
 * The one public site header: logo, location, the sign-in / sign-up / join
 * links (or the account menu once signed in), and the sign-up dialog. Every
 * public page renders this, so the header cannot differ from page to page.
 *
 * It is fixed to the top of the viewport. Pages whose first section is not a
 * full-bleed dark hero pass `spacer` so their content starts below it.
 */
const PublicHeader = ({ spacer = false, demo = IS_DEMO, googleClientId = GOOGLE_CLIENT_ID }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Session state drives which nav options to show. Customers persist
  // userSessionData, but stylers/admins only hold a JWT + role flag in
  // sessionStorage — so logged-in means "token present OR session data".
  const userSessionData = useSelector((state) => state.user.userSessionData);
  const isLoggedIn = Boolean(getAuthToken());
  const accountRole =
    getUserRole() || userSessionData?.role || (userSessionData ? "CUSTOMER" : "");
  const dashboardPath =
    accountRole === "STYLER"
      ? "/styler-dashboard"
      : accountRole === "ADMIN"
      ? "/admin"
      : "/dashboard";
  const appointmentsPath =
    accountRole === "STYLER" ? "/styler-dashboard/appointments" : "/dashboard";

  // Personalize the account menu: first name (or business name for stylists)
  // with a fallback label, plus a circular avatar showing the initial.
  const displayName =
    userSessionData?.firstname ||
    userSessionData?.businessName ||
    (accountRole === "STYLER" ? "Professional" : accountRole === "ADMIN" ? "Admin" : "Account");
  const avatarInitial = (displayName.trim().charAt(0) || "?").toUpperCase();

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    await dispatch(userLogOut());
    navigate("/");
  };

  // Remember where the visitor was before asking them to sign in, so a fresh
  // login can return them there instead of always dropping them on the dashboard.
  const goToLogin = () => {
    setIntendedRoute(window.location.pathname + window.location.search);
    navigate("/login");
  };

  const [signUpVisible, setSignUpVisible] = useState(false);
  const handleGoogleSignup = useGoogleSignup({ onDone: () => setSignUpVisible(false) });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signUpRole, setSignUpRole] = useState("customer"); // customer | stylist | admin
  const [searchParams] = useSearchParams();

  // Auto-open the signup modal when arriving with ?signup=1 (e.g. from the login page)
  useEffect(() => {
    if (searchParams.get("signup")) {
      if (demo) goToLiveSite("/?signup=1");
      else setSignUpVisible(true);
    }
  }, [searchParams, demo]);

  // Function to toggle the sign up modal
  const toggleSignUp = () => {
    // The demo API is read-only, so sign-up happens on the live site, which
    // opens this same dialog from ?signup=1.
    if (demo) { goToLiveSite("/?signup=1"); return; }
    setSignUpVisible(!signUpVisible);
    setMobileMenuOpen(false);
  };
  const userSignUp = useFormik({
    initialValues: {
      emailAddress: ""
    },
    validationSchema: Yup.object({
      emailAddress: Yup.string().required("Email is required").email("Invalid Email Address")
    }),
    onSubmit: async (values) => {
      const { emailAddress } = values;
      let verifyUserEmailData = { emailAddress };
      const { payload } = await dispatch(verifySignUpEmailAddress(verifyUserEmailData));
      if (payload?.statusCode === "200") {
        navigate("/verifyEmailAddress", { state: { emailAddress } });
      } else {
        showErrorToastMessage(payload?.message || "Could not start registration. Please try again.");
      }
    }
  });

  return (
    <>
      <Spinner loading={useSelector((state) => state.user).loading} />
      {spacer && <div aria-hidden="true" className="h-16 bg-black md:h-[76px]" />}
      {/* Navbar */}
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl text-white z-20">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:min-h-[76px] md:px-10 lg:px-[50px]">
          <Link to="/" aria-label="RapidStylers home" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="shrink-0">
            <img src={logo} alt="RapidStylers" className="h-8 w-auto sm:h-10" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
            <LocationBadge />
            <nav className="hidden items-center gap-4 text-sm md:flex md:gap-6" aria-label="Primary navigation">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={accountMenuOpen}
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    className="flex cursor-pointer items-center gap-2 transition hover:text-white/80"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{avatarInitial}</span>
                    <span className="hidden lg:inline text-sm">My Account</span>
                    <svg className="h-3.5 w-3.5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {accountMenuOpen && (
                    <>
                      <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setAccountMenuOpen(false)} />
                      <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-black/95 p-1.5 text-sm shadow-2xl">
                        <button type="button" role="menuitem" className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-white/10" onClick={() => { setAccountMenuOpen(false); navigate(dashboardPath); }}>My Account</button>
                        {(accountRole === "CUSTOMER" || accountRole === "STYLER") && (
                          <button type="button" role="menuitem" className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-white/10" onClick={() => { setAccountMenuOpen(false); navigate(appointmentsPath); }}>Appointments</button>
                        )}
                        {accountRole === "CUSTOMER" && (
                          <button type="button" role="menuitem" className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-white/10" onClick={() => { setAccountMenuOpen(false); navigate("/savedStylist"); }}>Saved stylists</button>
                        )}
                        <div className="my-1.5 h-px bg-white/10" aria-hidden="true" />
                        <button type="button" role="menuitem" className="w-full rounded-lg px-3 py-2.5 text-left text-brand hover:bg-white/10" onClick={handleLogout}>Log out</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <button type="button" className="cursor-pointer transition hover:text-white/80" onClick={goToLogin}>Login</button>
                  <button type="button" className="cursor-pointer transition hover:text-white/80" onClick={toggleSignUp}>Sign up</button>
                  <button type="button" className="cursor-pointer whitespace-nowrap transition hover:text-white/80" onClick={() => navigate('/styler-signup')}>Register as a beauty professional</button>
                  <Link to="/contact-support" className="cursor-pointer transition hover:text-white/80">Support</Link>
                </>
              )}
            </nav>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 md:hidden"
            >
              <span className="sr-only">Menu</span>
              <span className="text-xl leading-none">{mobileMenuOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-white/10 bg-black/90 px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-[1600px] gap-1">
              {isLoggedIn ? (
                <>
                  <button type="button" className="flex items-center gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); navigate(dashboardPath); }}>
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{avatarInitial}</span>
                    My Account
                  </button>
                  {(accountRole === "CUSTOMER" || accountRole === "STYLER") && (
                    <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); navigate(appointmentsPath); }}>Appointments</button>
                  )}
                  {accountRole === "CUSTOMER" && (
                    <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); navigate("/savedStylist"); }}>Saved stylists</button>
                  )}
                  <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-brand hover:bg-white/10" onClick={handleLogout}>Log out</button>
                </>
              ) : (
                <>
                  <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); goToLogin(); }}>Login</button>
                  <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={toggleSignUp}>Sign up</button>
                  <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-brand hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); navigate('/styler-signup'); }}>Register as a beauty professional</button>
                  <Link to="/contact-support" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>Support</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Sign Up modal */}
      <AccessibleModal
        isVisible={signUpVisible}
        onClose={() => setSignUpVisible(false)}
        modalTitle={"Sign Up"}
        width={"md:w-[40%]"}
      >
        <form onSubmit={userSignUp.handleSubmit}>
          <p className="text-sm font-semibold text-gray-700 mb-2">I want to join as a</p>
          <div className="flex gap-2 mb-4">
            {[
              { value: "customer", label: "Customer" },
              { value: "stylist", label: "Stylist" },
            ].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  if (role.value === "stylist") {
                    navigate("/styler-signup");
                    return;
                  }
                  setSignUpRole("customer");
                }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors ${
                  signUpRole === role.value
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {signUpRole === "customer" && googleClientId && (
            <>
              <GoogleSignInButton onSuccess={handleGoogleSignup} onError={(message) => showErrorToastMessage(message)} text="signup_with" />
              <div className="flex items-center gap-3 my-4">
                <span className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">or use your email</span>
                <span className="flex-1 border-t border-gray-200" />
              </div>
            </>
          )}
          {signUpRole === "customer" && (
            <InputWithLabel
              labelName={"Email address"}
              inputType={"email"}
              inputName={"emailAddress"}
              placeholder={"you@example.com"}
              autoComplete="email"
              required
              inputValue={userSignUp.values.emailAddress}
              inputOnBlur={userSignUp.handleBlur}
              inputOnChange={userSignUp.handleChange}
              inputError={
                userSignUp.touched.emailAddress && userSignUp.errors.emailAddress
                  ? userSignUp.errors.emailAddress
                  : null
              }
            />
          )}
          {signUpRole === "stylist" && (
            <p className="text-[13px] text-black/80">
              You'll create your stylist profile with business details, services
              and pricing in the next steps.
            </p>
          )}

          <div className="text-[13px] text-black/80 flex items-center gap-3 pt-2">
            <img src={info} alt="" aria-hidden="true" className="h-5" />
            <span>
              Please ensure you provide a valid email address. A verification
              code will be sent to this email for you to complete the signup
              process.
            </span>
          </div>
          <div className="flex justify-between items-center mt-8">
            <Button
              variant={"primary"}
              text={signUpRole === "customer" ? "Verify Email" : "Continue"}
              type={"submit"}
            />
            <p className="text-sm">
              Have an account?{" "}
              <button type="button" onClick={goToLogin} className="text-brand underline cursor-pointer">
                Sign in
              </button>
            </p>
          </div>
        </form>
      </AccessibleModal>
    </>
  );
};

/** Shows the user's location in the navbar; click to change it. */
const LocationBadge = () => {
  const { location } = useUserLocation() || {};
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!location || location.loading) return null;

  const display = location.city
    ? `${location.city}${location.province ? ", " + location.province : ""}`
    : location.province || "";

  if (!display) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label={`Change location (now ${display})`}
        className="flex min-h-[40px] min-w-[40px] items-center justify-center gap-1 rounded-lg text-white/80 hover:text-white transition-colors shrink-0 cursor-pointer md:min-w-0 md:justify-start"
        title="Change location"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 shrink-0 md:h-4 md:w-4" aria-hidden="true">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="hidden md:inline text-[11px] sm:text-xs truncate max-w-[140px]">{display}</span>
      </button>
      {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
    </>
  );
};

export default PublicHeader;
