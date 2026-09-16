import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import InputWithLabel from "../../../components/inputWithLabel";
import PasswordInput from "../../../components/passwordInput";
import PasswordRequirements from "../../../components/passwordRequirements";
import OtpInputs from "../../../components/otpInputs";
import Button from "../../../components/button";
import { APIService } from "../../../hooks/remote/apiService";
import { passwordProblem } from "../../../utils/passwordRule";
import { SUPPORT_EMAIL, SUPPORT_PHONE, showSuccessToastMessage } from "../../../utils/constant";

/**
 * Setting a new password when the old one is forgotten.
 *
 * This screen did not exist. Two surfaces advertised it anyway: the FAQ
 * ("Use the Forgot password link on the sign-in page") and a "Forgot password?"
 * link whose handler navigated to the sign-in page the visitor was already on.
 * The backend had carried the three endpoints the whole time, unused. So this is
 * the other half of a promise already made in writing.
 *
 * Three steps, in the order the backend enforces them: ask for a code, verify it,
 * then set the password. The order is not a UI preference, it is the server's
 * rule: the reset endpoint refuses unless a verified code for that address is on
 * record, so a visitor cannot reach the last step by typing its URL.
 *
 * The professional note is deliberate. Codes are issued against customer
 * accounts, and a professional who reaches this page would otherwise wait for an
 * email that is never sent, because the request endpoint answers identically
 * whether or not an address has an account (so nobody can use it to discover
 * which addresses do). Saying so up front, with the way to get help, is the
 * honest version of that.
 */

const STEPS = ["Your email", "Enter the code", "New password"];
const RESEND_SECONDS = 60;
const EMPTY_CODE = ["", "", "", "", "", ""];

const ResetPassword = () => {
  useEffect(() => {
    document.title = "Reset password | RapidStylers";
    // Optional chaining: never crash the page if the meta tag is missing.
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", "Reset your RapidStylers password with a one-time code sent to your email address.");
  }, []);

  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState(EMPTY_CODE);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [done, setDone] = useState(false);
  const codeRefs = useRef([]);

  // Tick the resend countdown down once per second, from the moment a code is
  // requested. Emails take a moment, so this stops a visitor asking repeatedly
  // and invalidating the code already on its way.
  useEffect(() => {
    if (step !== 1 || resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [step, resendIn]);

  useEffect(() => {
    if (step === 1) codeRefs.current[0]?.focus();
  }, [step]);

  const clearCode = () => {
    setCode(EMPTY_CODE);
    codeRefs.current[0]?.focus();
  };

  const requestCode = async (event) => {
    event.preventDefault();
    setError("");
    if (!emailAddress.trim()) {
      setError("Enter the email address on your account so we can send a code.");
      return;
    }
    setBusy(true);
    try {
      await APIService.generateResetPasswordToken({ emailAddress: emailAddress.trim() });
      // The endpoint answers the same way whether or not the address has an
      // account, so this step cannot honestly say a code was sent. It says what it
      // knows: one is on its way if the address has an account here.
      setResendIn(RESEND_SECONDS);
      setStep(1);
    } catch (err) {
      // APIService.extractError already surfaced the reason as a toast.
    } finally {
      setBusy(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setBusy(true);
    try {
      await APIService.generateResetPasswordToken({ emailAddress: emailAddress.trim() });
      showSuccessToastMessage("A new code is on its way. The previous one no longer works.");
      clearCode();
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      // Already surfaced.
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    const otpCode = code.join("");
    if (otpCode.length !== 6) {
      setError("Enter all 6 digits of the code.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await APIService.verifyOtpCode({ emailAddress: emailAddress.trim(), otpCode });
      if (res.data?.statusCode === "200") {
        setStep(2);
      } else {
        clearCode();
        setError(res.data?.message || "That code is incorrect or has expired. Check your email, or request a new code.");
      }
    } catch (err) {
      clearCode();
      setError("We could not check that code right now. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const setNewPassword = async (event) => {
    event.preventDefault();
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords do not match.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await APIService.resetUserPassword({
        emailAddress: emailAddress.trim(),
        password,
        confirmPassword,
      });
      if (res.data?.statusCode === "200") {
        setDone(true);
        setPassword("");
        setConfirmPassword("");
        showSuccessToastMessage("Password changed. You can sign in with it now.");
      } else {
        setError(res.data?.message || "We could not change your password. Please request a new code and try again.");
      }
    } catch (err) {
      setError("We could not change your password right now. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const changeDigit = (index, value) => {
    const digit = (value || "").replace(/\D/g, "").slice(-1);
    setError("");
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const pasteCode = (event) => {
    const pasted = (event.clipboardData || window.clipboardData || {})
      .getData
      ? (event.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6)
      : "";
    if (!pasted) return;
    event.preventDefault();
    setError("");
    setCode(pasted.split("").concat(Array(6 - pasted.length).fill("")));
    codeRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const resendLabel = `${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, "0")}`;

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left panel: what this flow is, and how far along the visitor is. */}
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block relative">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white px-10">
          <div className="max-w-sm grid gap-8">
            <p className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.02em]">
              Back into your <span className="text-brand">RapidStylers</span> account
            </p>
            <ol className="grid gap-4">
              {STEPS.map((label, index) => {
                const here = index === step;
                return (
                  <li
                    key={label}
                    aria-current={here ? "step" : undefined}
                    className={`flex items-center gap-3 ${here ? "" : "opacity-50"}`}
                  >
                    <span
                      className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        index <= step ? "bg-brand text-white" : "border-2 border-white text-white"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm">{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>

      {/* Right panel: the step itself. */}
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full max-h-screen overflow-y-auto">
            <Link to="/login">
              <img src={logo} alt="RapidStylers" className="h-10 mb-8" />
            </Link>

            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">
              Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
            </p>
            <p className="mt-2 text-[22px] font-normal tracking-[-0.01em] text-onSurface">
              {done ? "Password changed" : STEPS[step]}
            </p>

            {done ? (
              <>
                <p className="mt-1 text-sm text-black/60">
                  Your password is updated. Sign in with it, and the new one works on every device.
                </p>
                <div className="mt-6">
                  <Button text="Go to sign in" variant="primary" type="button" onClick={() => navigate("/login")} />
                </div>
              </>
            ) : step === 0 ? (
              <>
                <p className="mt-1 text-sm text-black/60">
                  Enter the email address on your account and we will send a one-time code. You
                  will use it to choose a new password.
                </p>
                <form onSubmit={requestCode} className="mt-6 grid gap-4">
                  <InputWithLabel
                    labelName="Email address"
                    inputType="email"
                    placeholder="you@example.com"
                    inputName="emailAddress"
                    inputValue={emailAddress}
                    inputOnChange={(event) => {
                      setError("");
                      setEmailAddress(event.target.value);
                    }}
                  />
                  {error && (
                    <p role="alert" className="text-xs text-red-500">
                      {error}
                    </p>
                  )}
                  <Button
                    text={busy ? "Requesting code..." : "Request code"}
                    variant="primary"
                    type="submit"
                    disabled={busy}
                  />
                </form>

                {/* This covers customer accounts only. A professional who reached
                    this page would wait for mail that is never sent, because the
                    request endpoint refuses to reveal whether an address has an
                    account, so the flow cannot detect them and say so itself. */}
                <div className="mt-8 border-t border-black/10 pt-5">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-muted">For professionals</p>
                  <p className="mt-3 text-[13px] leading-[1.6] text-black/55">
                    At the moment this covers customer accounts. If you signed up as a
                    professional and need your password changed, contact us at{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-brand font-semibold hover:underline">
                      {SUPPORT_EMAIL}
                    </a>{" "}
                    or{" "}
                    <a
                      href={`tel:${SUPPORT_PHONE.replace(/[^\d+]/g, "")}`}
                      className="text-brand font-semibold hover:underline"
                    >
                      {SUPPORT_PHONE}
                    </a>{" "}
                    and we will reset it for you.
                  </p>
                </div>
              </>
            ) : step === 1 ? (
              <>
                <p className="mt-1 text-sm text-black/60">
                  If <span className="font-medium text-onSurface">{emailAddress.trim()}</span> has an
                  account here, a 6-digit code is on its way. Enter it below.
                </p>
                <form onSubmit={verifyCode} className="mt-6">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        clearCode();
                      }}
                      className="text-[13px] font-semibold text-brand underline-offset-4 hover:underline"
                    >
                      Clear code
                    </button>
                    {resendIn > 0 ? (
                      <p className="text-[13px] text-black/45">Resend code in {resendLabel}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendCode}
                        disabled={busy}
                        className="text-[13px] font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {code.map((digit, index) => (
                      <OtpInputs
                        key={`digit${index + 1}`}
                        id={`digit${index + 1}`}
                        value={digit}
                        onChange={(event) => changeDigit(index, event.target.value)}
                        onPaste={pasteCode}
                        inputRef={(element) => (codeRefs.current[index] = element)}
                      />
                    ))}
                  </div>

                  {error && (
                    <p role="alert" className="mt-3 text-xs text-red-500">
                      {error}
                    </p>
                  )}

                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep(0);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      text={busy ? "Checking..." : "Continue"}
                      variant="primary"
                      type="submit"
                      disabled={busy}
                    />
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm text-black/60">
                  Choose a new password. It replaces the old one everywhere you sign in.
                </p>
                <form onSubmit={setNewPassword} className="mt-6 grid gap-4">
                  <PasswordInput
                    labelName="New password"
                    inputType="password"
                    placeholder="Enter a strong password"
                    inputName="password"
                    inputValue={password}
                    inputOnChange={(event) => {
                      setError("");
                      setPassword(event.target.value);
                    }}
                  />
                  <PasswordInput
                    labelName="Confirm new password"
                    inputType="password"
                    placeholder="Re-enter your new password"
                    inputName="confirmPassword"
                    inputValue={confirmPassword}
                    inputOnChange={(event) => {
                      setError("");
                      setConfirmPassword(event.target.value);
                    }}
                  />
                  {/* The same list the other three password screens render, from the
                      same rule, so it cannot describe a rule the server does not have. */}
                  <PasswordRequirements value={password} />
                  {error && (
                    <p role="alert" className="text-xs text-red-500">
                      {error}
                    </p>
                  )}
                  <Button
                    text={busy ? "Changing password..." : "Change password"}
                    variant="primary"
                    type="submit"
                    disabled={busy}
                  />
                </form>
              </>
            )}

            <div className="mt-8 border-t border-black/10 pt-5 text-[13px]">
              <Link to="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </div>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
