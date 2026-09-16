import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/button";
import OtpInputs from "../../../components/otpInputs";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { readStoredSignupEmail, storeSignupEmail } from "./signupFlow";
import { APIService } from "../../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../../utils/constant";

/** How long before another code can be requested. Emails can be slow, so the
 *  countdown exists to stop a professional asking five times in a minute and
 *  invalidating the code that is already on its way. */
const RESEND_SECONDS = 60;

const EMPTY_CODE = ["", "", "", "", "", ""];

/**
 * The professional signup code step.
 *
 * This is the same job as the customer flow's code step, and it used to be a
 * different screen doing it: its own input boxes rather than the shared
 * component, and no way to ask for another code or to start the entry again. The
 * missing resend was the one with teeth. A professional whose code never arrived,
 * or who mistyped and wanted to clear the boxes, had no move except Back to
 * step 1 and resubmitting their details, which is how the flow re-sent the code
 * by accident rather than on purpose. Both hatches now exist here.
 *
 * The address is part of the request, not decoration: codes are looked up by the
 * address they were issued to, so verification without one is refused before the
 * code is even compared. This step knows the address from step 1, and says so
 * plainly when a reload has left it without one.
 */
const StylerVerifyEmail = () => {
  const navigate = useNavigate();
  const { formData, updateData, markEmailVerified } = useStylerSignup();
  const signupEmail = formData.emailAddress || readStoredSignupEmail();

  const [otp, setOtp] = useState(EMPTY_CODE);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Tick the resend countdown down once per second.
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setInterval(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [resendIn]);

  /**
   * Empty the boxes and put the cursor back in the first one. Deliberately silent
   * about the error: the caller decides what the professional should be told. A
   * rejection has to clear the boxes and then explain itself, and React batches
   * those updates in call order, so the message set after this one is the message
   * that survives.
   */
  const clearCode = () => {
    setOtp(EMPTY_CODE);
    inputRefs.current[0]?.focus();
  };

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    setError("");

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current and go to previous
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData || {})
      .getData
      ? (e.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6)
      : "";
    if (!pasted) return;
    setError("");
    const next = pasted.split("").concat(Array(6 - pasted.length).fill(""));
    setOtp(next);
    // Focus the next empty box, or the last one when the paste filled them all.
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleResendCode = async () => {
    setError("");
    if (!signupEmail) {
      setError("We don't have your email address on file. Go back a step and enter it again so we can send a fresh code.");
      return;
    }
    setResending(true);
    try {
      await APIService.stylerGenerateOtp({ emailAddress: signupEmail });
      showSuccessToastMessage("A new verification code is on its way. The previous one no longer works.");
      // The old digits no longer match the fresh code, so the boxes are emptied
      // rather than left looking answered.
      setError("");
      clearCode();
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      // APIService.extractError already surfaced the reason as a toast.
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    if (!signupEmail) {
      setError("We don't have your email address on file. Go back a step and enter it again so we can send a fresh code.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const res = await APIService.stylerVerifyOtp({ emailAddress: signupEmail, otpCode: code });
      if (res.data?.statusCode === "200") {
        // Use the email from the backend response (source of truth) and persist
        // it into the shared context + sessionStorage.
        const verifiedEmail = res.data?.emailAddress || signupEmail;
        storeSignupEmail(verifiedEmail);
        updateData({ emailAddress: verifiedEmail });
        // The flow's guard reads this: the business step is only reachable once
        // the code has been accepted, not merely requested.
        markEmailVerified();
        showSuccessToastMessage("Email verified! Continue with your registration.");
        navigate("/styler-signup/business-details");
      } else {
        // Empty the boxes first, then say why: the boxes are ready for an
        // immediate retype and the reason survives the clearing.
        clearCode();
        setError(res.data?.message || "Invalid OTP code. Please try again.");
      }
    } catch (err) {
      clearCode();
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const resendLabel = `${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, "0")}`;

  return (
    <div>
      {/* The shell titles this step; what it cannot know is which address the
          code went to, so that is what this line carries. Landing here directly
          (a bookmark, a refresh after the tab was closed) means there is no
          address to name, and "sent to ." is not a sentence, so that case gets
          its own wording rather than a dangling clause. */}
      <p className="text-sm text-black/60 mb-4">
        {signupEmail ? (
          <>
            A 6-digit verification code was sent to{" "}
            <span className="font-medium text-onSurface">{signupEmail}</span>. Enter it below
            to continue.
          </>
        ) : (
          <>Enter the 6-digit verification code we sent to your email address to continue.</>
        )}
      </p>

      <form onSubmit={handleSubmit}>
        {/* The same two hatches the customer code step has. Asking for another code
            is the move a professional needs when the first one never arrives, and
            it replaces the old dead end of going back a step to trigger a resend. */}
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
              onClick={handleResendCode}
              disabled={resending}
              className="text-[13px] font-semibold text-brand underline-offset-4 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend code"}
            </button>
          )}
        </div>

        {/* OTP inputs. Six boxes in a six-column row, the same layout every other
            code step uses, so the boxes are the same size wherever they appear. */}
        <div className="mb-4 grid grid-cols-6 gap-2">
          {otp.map((digit, i) => (
            <OtpInputs
              key={`digit${i + 1}`}
              id={`digit${i + 1}`}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              inputRef={(el) => (inputRefs.current[i] = el)}
            />
          ))}
        </div>

        {error && (
          <p role="alert" className="mb-3 text-center text-xs text-red-500">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          {/* One button component for both actions, so Back keeps the app's
              shape instead of carrying its own border and radius. */}
          <Button variant="ghost" type="button" onClick={() => navigate("/styler-signup")}>
            Back
          </Button>
          <Button
            text={verifying ? "Verifying..." : "Verify"}
            variant="primary"
            type="submit"
            disabled={verifying}
          />
        </div>
      </form>
    </div>
  );
};

export default StylerVerifyEmail;
