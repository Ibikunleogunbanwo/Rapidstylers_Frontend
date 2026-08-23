import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Buttons from "../../../components/button";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { APIService } from "../../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../../utils/constant";

const StylerVerifyEmail = () => {
  const navigate = useNavigate();
  const { formData } = useStylerSignup();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

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
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = pasted.split("").concat(Array(6 - pasted.length).fill(""));
      setOtp(newOtp);
      // Focus the next empty or the last filled
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const res = await APIService.stylerVerifyOtp(code);
      if (res.data?.statusCode === "200") {
        showSuccessToastMessage("Email verified! Continue with your registration.");
        navigate("/styler-signup/business-details");
      } else {
        setError(res.data?.message || "Invalid OTP code. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div>
      <p className="my-4 font-bold">Verify your email address.</p>
      <p className="text-sm text-gray-500 mb-4">
        A 6-digit verification code was sent to{" "}
        <span className="font-medium text-gray-700">{formData.emailAddress}</span>.
        Enter it below to continue.
      </p>

      {/* OTP inputs */}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 justify-center mb-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className="w-11 h-12 text-center text-lg font-bold rounded-md border border-gray-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-xs text-center mb-3">{error}</p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/styler-signup")}
            className="py-3 px-5 text-sm text-gray-600 font-medium border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back
          </button>
          <Buttons
            btnText={verifying ? "Verifying..." : "Verify"}
            btnType="primary"
            type="submit"
            disabled={verifying}
          />
        </div>
      </form>
    </div>
  );
};

export default StylerVerifyEmail;
