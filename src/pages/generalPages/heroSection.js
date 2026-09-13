
import logo from "../../assets/svg-icons/logo.svg";
import React, { useState } from "react";
import info from "../../assets/svg-icons/info.svg";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/button";
import InputWithLabel from "../../components/inputWithLabel";
import Modal from "../../components/modals";
import { useFormik } from "formik";
import * as Yup from "yup";
import Spinner from "../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails, setUserSession, userAuthenticate, verifySignUpEmailAddress } from "../../hooks/local/userReducer";
import PasswordInput from "../../components/passwordInput";
import SearchForStyler from "../../components/searchForStyler";
import GoogleSignInButton from "../../components/googleSignInButton";

import elevate from "../../assets/images/elevate.webp"
import { setAuthToken, setRefreshToken, showSuccessToastMessage } from "../../utils/constant";
import { getPeriodOfDay } from "../../utils/utility";
// Google Sign-In client id (public). Empty hides the Google button + divider.
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

const Hero = ({ height }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userError = useSelector((state) => state.user?.error);

  const [signInVisible, setSignInVisible] = useState(false);
  const [signUpVisible, setSignUpVisible] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const toggleSignIn = () => {
    setSignInVisible(!signInVisible);
    setSignUpVisible(false);
  };

  const toggleSignUp = () => {
    setSignUpVisible(!signUpVisible);
    setSignInVisible(false);
  };
  const periodOfTheDay = getPeriodOfDay();
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
      if (payload.statusCode === "200") {
        // Persist the signup email so a refresh mid-flow doesn't lose it.
        sessionStorage.setItem("signupEmail", emailAddress);
        navigate("/verifyEmailAddress", { state: { emailAddress } });
      }
    }
  });

  const userSignIn = useFormik({
    initialValues: {
      emailAddress: "",
      password: ""
    },
    validationSchema: Yup.object({
      emailAddress: Yup.string().email("Invalid Email Address").required("Email is required"),
      password: Yup.string().required("Password cannot be empty"),
    }),
    onSubmit: async (values) => {
      const { emailAddress, password } = values;
      let authData = { emailAddress, password };
      const { payload } = await dispatch(userAuthenticate(authData))
      if (payload.statusCode === "200") {
        showSuccessToastMessage(`Good ${periodOfTheDay} `+payload.data.firstname);
        dispatch(getUserDetails(payload.data.userId));
        navigate('/dashboard');
      }
    }
  })

  // Google sign-in (customer-only on the backend). Reuses the unified session
  // shape so the dashboard guard passes exactly like the password path.
  const handleGoogleSuccess = async (res) => {
    const token = res.data?.token;
    const refreshToken = res.data?.refreshToken;
    const account = res.data?.data?.account;
    if (!token || !account) {
      setGoogleError("Google sign-in did not return a session. Please try again.");
      return;
    }
    setAuthToken(token);
    if (refreshToken) {
      setRefreshToken(refreshToken);
    }
    dispatch(setUserSession(res.data));
    dispatch(getUserDetails(account.userId));
    showSuccessToastMessage(
      `Good ${periodOfTheDay}${account.firstname ? ", " + account.firstname : ""}`
    );
    setSignInVisible(false);
    setGoogleError("");
    navigate('/dashboard');
  };
  return (
    <div style={{ height }} className="relative z-10">
      <Spinner loading={useSelector((state) => state.user).loading} />

      <div className="h-[100%] absolute w-full flex items-center overflow-hidden">
        <div className="w-full h-full relative">
          {/* Landing */}
          <div className={`absolute w-full h-full flex top-0 items-center justify-center px-4 pt-[60px] sm:pt-[80px] bg-black ${document.title === "Welcome - RapidStylers" ? "block" : "hidden"}`}>
            <div className="w-full md:w-[50%] lg:w-[40%]">
                <div className="text-[22px] sm:text-xl md:text-2xl lg:text-[28px] font-bold text-white justify-self-center text-center mb-2 leading-snug">
                  Get convenient,<span className="text-brand"> high-quality beauty services </span>without leaving your home.
                </div>
              <p className="text-white/70 text-xs sm:text-sm md:text-base text-center justify-self-center max-w-md mx-auto">Our platform connects you with top-rated local beauty professionals for in-home appointments.</p>
              <SearchForStyler />
            </div>
          </div>

          {/* About */}
          {/* Left-aligned and type-only, against a flat near-black: the statement
              carries the section, and the colour on this page comes from the work
              in the photos rather than from a gradient behind the words. */}
          <div className={`relative w-full h-full ${document.title === "About us | RapidStylers" ? "block" : "hidden"}`}>
            {/* Bottom-aligned: the fixed navbar covers the top of this box, so
                centred content put the eyebrow label underneath it. Anchoring to
                the bottom keeps the statement clear of the chrome at every height. */}
            <div className="h-full w-full bg-[#0A0A0A] relative flex items-end overflow-hidden">
              <div className="relative w-full px-5 md:px-[50px] lg:px-[100px] pt-[120px] pb-10 md:pb-14">
                <div className="mx-auto max-w-[1240px]">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">About RapidStylers</p>
                  <h1 className="mt-5 max-w-[880px] text-[clamp(2rem,4.6vw,3.6rem)] font-normal leading-[1.06] tracking-[-0.02em] text-white">
                    Say goodbye to the{" "}
                    <span className="text-white/40">salon struggle.</span>
                  </h1>
                  <p className="mt-6 max-w-[520px] text-[13px] leading-[1.55] text-white/60">
                    Search by service or by professional, look at real portfolios
                    and reviews, then book a time that works for you. The
                    professional accepts, and the appointment happens on your
                    schedule — not a salon's opening hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Elevate your looks */}
          <div className={`relative ${document.title === "Elevate your looks | RapidStylers" ? "block" : "hidden"}`}>
            <img src={elevate} alt=""  className="h-[75vh] object-cover"/>
            <div className="h-full w-full flex items-center justify-center absolute top-0 pt-[80px] text-white text-center px-10">
              <div>
                <p className="text-2xl md:text-3xl font-medium mb-3">Elevate your style</p>
                <p>Explore our exclusive collection of trendsetting styles for men and women</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div className="fixed w-full flex items-center border-b border-[#ffffff16] bg-[#00000060] backdrop-blur-xl px-3 sm:px-4 md:px-[50px] text-white py-3 sm:py-4 md:py-5 z-20">
        <div className="w-full flex justify-between items-center">
          <Link to={"/"} onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}>
            <img src={logo} alt="RapidStylers" className="h-8 sm:h-10" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            <div className="flex items-center gap-2 sm:gap-3 md:divide-x md:text-sm text-[11px] sm:text-xs">
              <span className="md:pe-3 cursor-pointer hover:text-white/80 transition" onClick={toggleSignIn}>
                Login
              </span>
              <span className="px-2 sm:px-3 md:ps-3 cursor-pointer hover:text-white/80 transition" onClick={toggleSignUp}>
                Sign up
              </span>
              <span className="hidden sm:inline md:ps-3 cursor-pointer hover:text-white/80 transition" onClick={() => navigate('/styler-signup')}>                 Register as a beauty professional
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sign in modal */}
      <Modal
        modalTitle={"Login"}
        isVisible={signInVisible}
        onClose={() => setSignInVisible(false)}
        width={"md:w-[40%] lg:w-[35%]"}
      >
        {GOOGLE_CLIENT_ID && (
          <div className="grid gap-3 mb-4">
            <GoogleSignInButton onSuccess={handleGoogleSuccess} onError={setGoogleError} />
            <div className="flex items-center gap-3 my-1">
              <span className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
              <span className="flex-1 border-t border-gray-200" />
            </div>
          </div>
        )}
        <form onSubmit={userSignIn.handleSubmit}>
          <div className="flex gap-3 flex-col">
            <InputWithLabel
              labelName={"Email address"}
              inputType={"email"}
              inputName={"emailAddress"}
              inputValue={userSignIn.values.emailAddress}
              inputOnBlur={userSignIn.handleBlur}
              inputOnChange={userSignIn.handleChange}
              inputError={
                userSignIn.touched.emailAddress &&
                userSignIn.errors.emailAddress
                  ? userSignIn.errors.emailAddress
                  : null
              }
            />
            <PasswordInput
              labelName={"Password"}
              inputType={"password"}
              inputName={"password"}
              inputValue={userSignIn.values.password}
              inputOnBlur={userSignIn.handleBlur}
              inputOnChange={userSignIn.handleChange}
              inputError={
                userSignIn.touched.password && userSignIn.errors.password
                  ? userSignIn.errors.password
                  : null
              }
            />
          </div>

          {(userError || googleError) && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{googleError || userError}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-4">
            <Button text={"Continue"} variant={"primary"} type={"submit"} />
            <p className="text-sm font-medium text-brand underline cursor-pointer" onClick={() => { setSignInVisible(false); navigate('/login'); }}>
              Forgot password?
            </p>
          </div>
        </form>

        <p className="text-sm">
          Don't have an account?{" "}
          <span
            className="text-brand underline cursor-pointer"
            onClick={toggleSignUp}
          >
            Sign up
          </span>
        </p>
      </Modal>

      {/* Sign Up modal */}
      <Modal
        isVisible={signUpVisible}
        onClose={() => setSignUpVisible(false)}
        modalTitle={"Sign Up"}
        width={"md:w-[40%]"}
      >
        <form onSubmit={userSignUp.handleSubmit}>
          <InputWithLabel
            labelName={"Email address"}
            inputType={"email"}
            inputName={"emailAddress"}
            inputValue={userSignUp.values.emailAddress}
            inputOnBlur={userSignUp.handleBlur}
            inputOnChange={userSignUp.handleChange}
            inputError={
              userSignUp.touched.emailAddress && userSignUp.errors.emailAddress
                ? userSignUp.errors.emailAddress
                : null
            }
          />
          <div className="text-[13px] text-black/80 flex items-center gap-3 pt-2">
            <img src={info} alt="" className="h-5" />
            <span>
              Please ensure you provide a valid email address. A verification
              code will be sent to this email for you to complete the signup
              process.
            </span>
          </div>
          <div className="flex justify-between items-center mt-8">
            <Button
              variant={"primary"}
              text={"Verify Email"}
              type={"submit"}
            />
            <p className="text-sm" onClick={toggleSignIn}>
              {" "}
              Return to {""}{" "}
              <span className="text-brand underline cursor-pointer">
                Sign in
              </span>
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hero;
