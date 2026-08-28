import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import OtpInputs from "../../../components/otpInputs";
import { useFormik } from "formik";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Buttons from "../../../components/button";
import { verifyOtpCode } from "../../../hooks/local/userReducer";
import Spinner from "../../../components/spinner";
import { APIService } from "../../../hooks/remote/apiService";
import { showSuccessToastMessage, showErrorToastMessage } from "../../../utils/constant";

const steps = [
  "Register email address",
  "Verify email address",
  "Personal details",
  "Secure your account",
];

const VerifyUserEmailAddress = () => {
  useEffect(() => {
    document.title = "Verify Email Address | RapidStylers";
    // Optional chaining: never crash the page if the meta tag is missing.
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", "Verify Email Address to validate your account for your beautification");
}, []);

const location  = useLocation();
const navigate = useNavigate();
const dispatch = useDispatch();

const userEmailAddress = location.state?.emailAddress || sessionStorage.getItem('signupEmail') || '';

  // Controlled OTP digits — the digit you type is rendered by React from state
  // on every keystroke, so it is always visible and can never be wiped or
  // hidden by a re-render.
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const otpRefs = React.useRef([]);
  // Countdown before the code can be resent (emails can be slow).
  const [resendIn, setResendIn] = React.useState(60);
  const [resending, setResending] = React.useState(false);
  // Inline error shown under the boxes when the submitted code is rejected.
  const [otpError, setOtpError] = React.useState(null);

  const handleOTPDigitChange = (index, event) => {
    setOtpError(null);
    const raw = event.target.value.replace(/\D/g, "");
    const next = [...digits];
    if (raw) {
      next[index] = raw.slice(-1);
    } else {
      // Backspace on a filled box clears it and moves back.
      next[index] = "";
      if (index > 0) otpRefs.current[index - 1]?.focus();
    }
    setDigits(next);
    verifyUserEmail.setFieldValue("otpCode", next.join(""));
    // Auto-advance to the next box after a digit is entered.
    if (raw && index < digits.length - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOTPDigitKeyDown = (index, event) => {
    // Backspace on an empty box moves back to the previous digit.
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Paste a full code from the email in one go: digits are spread across the
  // boxes starting at the box being pasted into (garbage/non-digits ignored),
  // then focus lands after the last filled box.
  const handleOTPPaste = (index, event) => {
    setOtpError(null);
    const pasted = (event.clipboardData || window.clipboardData || {}).getData
      ? (event.clipboardData || window.clipboardData).getData("text")
      : "";
    const cleaned = pasted.replace(/\D/g, "").slice(0, 6 - index);
    if (!cleaned) return;
    event.preventDefault();
    const next = [...digits];
    cleaned.split("").forEach((digit, i) => {
      next[index + i] = digit;
    });
    setDigits(next);
    verifyUserEmail.setFieldValue("otpCode", next.join(""));
    const targetIndex = Math.min(index + cleaned.length, digits.length - 1);
    otpRefs.current[targetIndex]?.focus();
  };

  const clearUserOTP = () => {
    setOtpError(null);
    setDigits(["", "", "", "", "", ""]);
    verifyUserEmail.setFieldValue("otpCode", "");
    otpRefs.current[0]?.focus();
  };

  // Tick the resend countdown down once per second.
  React.useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  const handleResendCode = async () => {
    setOtpError(null);
    if (!userEmailAddress) {
      showErrorToastMessage("We don't have your email on file — please restart registration.");
      return;
    }
    setResending(true);
    try {
      await APIService.generateSignUpOtpCode({ emailAddress: userEmailAddress });
      showSuccessToastMessage("A new verification code was sent to your email.");
      clearUserOTP(); // the old digits no longer match the fresh code
      setResendIn(60);
    } catch (error) {
      // APIService displays the server error.
    } finally {
      setResending(false);
    }
  };

  const resendLabel = `${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, "0")}`;
  const verifyUserEmail = useFormik({
    initialValues: {
      otpCode: "",
    },
    onSubmit: async (values) => {
      const {otpCode} = values
      try {
        const {payload} = await dispatch(verifyOtpCode(otpCode));
        if(payload.statusCode === "200") {
          setOtpError(null);
          // Use the email from the backend response (source of truth) and persist
          // it so a refresh on the next step keeps the flow working.
          const verifiedEmail = payload.data?.emailAddress || userEmailAddress;
          sessionStorage.setItem('signupEmail', verifiedEmail);
          navigate("/personalDetails", {state : {userEmailAddress: verifiedEmail}});
        } else {
          setOtpError(payload.message || "The code you entered is incorrect or has expired. Check your email and try again, or request a new code.");
        }
      } catch (error) {
        // APIService.extractError already surfaced network/server errors as a toast.
        setOtpError("We couldn't verify that code right now. Please try again in a moment.");
      }
    },
  })

  // Auto-submit as soon as the code is complete (typed or pasted). The effect
  // fires on the incomplete -> complete transition only, so a failed attempt
  // does not re-submit on every re-render. Clearing a box (backspace / Clear
  // code) makes it incomplete, so retyping the code re-arms the submit.
  const otpComplete = verifyUserEmail.values.otpCode.length === 6;
  React.useEffect(() => {
    if (otpComplete) {
      verifyUserEmail.handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpComplete])
  return (
    <React.Fragment>
       <Spinner loading={useSelector((state)=>state.user).loading}/>
    <div className="h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left panel */}
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block relative">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white px-10">
          <div className="max-w-sm grid gap-8">
            <p className="text-3xl font-bold font-serif leading-tight">
              Create your <span className="text-brand">RapidStylers</span> account
            </p>
            <div className="grid gap-4">
              {steps.map((step, i) => (
                <div key={step} className={`flex items-center gap-3 ${i + 1 === 2 ? "" : "opacity-50"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= 2 ? "bg-brand text-white" : "border-2 border-white text-white"}`}>
                    {i + 1}
                  </div>
                  <div className="text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full">
            <img src={logo} alt="" className="h-10 mb-8" />
            <p className="text-2xl font-bold text-gray-900">Verify your email address.</p>
            <p className="text-black/60 text-sm mt-1">
              A verification code was sent to your email address ({userEmailAddress}).
              Please provide the code and click on verify.
            </p>
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-primary/50 cursor-pointer" onClick={clearUserOTP}>Clear code</p>
              {resendIn > 0 ? (
                <p className="text-sm font-semibold text-black/40">Resend code in {resendLabel}</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="text-sm font-semibold text-brand hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>
            <div className="w-full grid grid-cols-6 md:grid-cols-10 gap-4 mt-8">
              {digits.map((digit, index) => (
                <OtpInputs
                  key={`digit${index + 1}`}
                  id={`digit${index + 1}`}
                  value={digit}
                  onChange={(event) => handleOTPDigitChange(index, event)}
                  onKeyDown={(event) => handleOTPDigitKeyDown(index, event)}
                  onPaste={(event) => handleOTPPaste(index, event)}
                  inputRef={(el) => (otpRefs.current[index] = el)}
                />
              ))}
            </div>
            {otpError && (
              <p role="alert" className="text-xs text-red-500 mt-3 flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{otpError}</span>
              </p>
            )}
            <div className="mt-6">
              <form onSubmit={verifyUserEmail.handleSubmit}>
                <input name="otpCode" type="text" id="userInput" hidden  value={verifyUserEmail.values.otpCode} onChange={verifyUserEmail.handleChange} onBlur={verifyUserEmail.handleBlur} />
                <Buttons btnType={"primary"} type={"submit"} btnText={"Verify"} />
              </form>
            </div>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default VerifyUserEmailAddress;
