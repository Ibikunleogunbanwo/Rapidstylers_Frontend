import { Formik, Form } from "formik";
import { z } from "zod";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../../components/button";
import InputWithLabel from "../../../components/inputWithLabel";
import PasswordRequirements from "../../../components/passwordRequirements";
import { passwordProblem } from "../../../utils/passwordRule";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { clearStoredSignupEmail } from "./signupFlow";
import { APIService } from "../../../hooks/remote/apiService";
import { uploadToCloudinary, deleteCloudinaryImage } from "../../../utils/cloudinaryUpload";
import { showSuccessToastMessage, showErrorToastMessage } from "../../../utils/constant";
import { clearSignupUploadPass } from "../../../utils/signupUploadPass";
import { isAccountAlreadyExists } from "../../../utils/signupReply";

import { submitRegistration } from "./registrationSubmit";

/* ── Zod schema (the shared rule, measured from backend PASSWORD_PATTERN) ── */
const passwordSchema = z
  .object({
    // The rule itself lives in utils/passwordRule, which the customer signup and
    // change-password screens read as well. The special-character check used to be
    // `[^A-Za-z0-9]` here, which accepts `%` and is refused by the server; the
    // shared rule carries the exact set the server takes and reports whichever
    // single requirement is missing.
    password: z.string().superRefine((value, ctx) => {
      const problem = passwordProblem(value);
      if (problem) ctx.addIssue({ code: "custom", message: problem });
    }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "You must agree to the Terms and Conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function toFormikErrors(zodError) {
  const out = {};
  zodError.issues.forEach((issue) => {
    const field = issue.path[0];
    if (field && !out[field]) out[field] = issue.message;
  });
  return out;
}

/* ── Component ──────────────────────────────────────────────────────── */
const CreatePassword = () => {
  const navigate = useNavigate();
  const { formData, imageFiles, forgetSignupDraft, creationUncertain, markCreationUncertain, markEmailUnverified } = useStylerSignup();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState(creationUncertain ? "We could not confirm whether your account was created. Try signing in before registering again." : "");

  const initialValues = {
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  };

  const validate = (values) => {
    const result = passwordSchema.safeParse(values);
    if (result.success) return {};
    return toFormikErrors(result.error);
  };

  const handleSubmit = async (values) => {
    if (creationUncertain || submitting) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      setUploadingImages(true);
      const res = await submitRegistration({
        files: imageFiles,
        payload: { ...formData, password: values.password, agreeToTerms: values.agreeToTerms === true },
        upload: uploadToCloudinary,
        remove: deleteCloudinaryImage,
        create: (payload) => {
          setUploadingImages(false);
          return APIService.createStyler(payload);
        },
      });
      if (Number(res.data?.statusCode) === 200) {
        // The account exists, so the remembered answers have served their purpose.
        // Keeping them would offer the next professional who signs up in this tab a
        // form filled in with the details of the one before them, and keep their ID
        // photo in the browser for the life of the tab. A failed attempt keeps the
        // draft, because retyping four steps is the cost of that failure.
        forgetSignupDraft();
        clearStoredSignupEmail();
        clearSignupUploadPass();
        showSuccessToastMessage("Account created! You can now sign in.");
        navigate("/login");
      } else {
        setSubmitError(res.data?.message || "Registration failed. Please try again.");

      }
    } catch (err) {
      // The photo pass from the email code has run out. Nothing was created and
      // the draft and photos are kept, so send them back to get a fresh code.
      if (err?.code === "SIGNUP_PASS_EXPIRED") {
        clearSignupUploadPass();
        markEmailUnverified();
        showErrorToastMessage(err.message);
        navigate("/styler-signup/verify-email");
        return;
      }
      // APIService.extractError already shows a toast, but set inline too
      if (err.uncertain) markCreationUncertain();
      // An email that already has an account is not the professional's mistake,
      // so keep the server's own wording (which names the email) instead of the
      // generic "details were rejected", and let the form offer a way in below.
      const serverMessage = err?.response?.data?.message;
      setSubmitError(
        err.uncertain || err.stage === "upload"
          ? err.message
          : isAccountAlreadyExists(serverMessage)
            ? serverMessage
            : "Your account details were rejected. Review your details and try again."
      );
    } finally {
      setUploadingImages(false);
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={validate}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form>
          {/* The step's heading comes from the shell's step table. */}
          <div className="grid gap-4">
            <InputWithLabel
              labelName="Set password"
              inputType="password"
              placeholder="Enter a strong password"
              inputName="password"
              autoComplete="new-password"
              required
              inputValue={values.password}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={(touched.password || Boolean(values.password)) && errors.password ? errors.password : ""}
            />
            <InputWithLabel
              labelName="Confirm password"
              inputType="password"
              placeholder="Re-enter your password"
              inputName="confirmPassword"
              autoComplete="new-password"
              required
              inputValue={values.confirmPassword}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={(touched.confirmPassword || Boolean(values.confirmPassword)) && errors.confirmPassword ? errors.confirmPassword : ""}
            />
          </div>

          {/* The rows come from the shared rule, so the list cannot describe a
              different rule from the one that rejects the form. */}
          <PasswordRequirements value={values.password} />

          {/* Terms and conditions */}
          <div className="mt-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={values.agreeToTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                className="mt-1 h-4 w-4 rounded border-black/20 text-brand focus:ring-brand"
              />
              <span className="text-sm text-black/60">
                I agree to the{' '}
                <Link to="/terms-and-conditions" target="_blank" className="text-brand font-semibold hover:underline">
                  Terms and Conditions
                </Link>
              </span>
            </label>
            {touched.agreeToTerms && errors.agreeToTerms && (
              <p className="text-xs text-red-500 mt-1 ml-7">{errors.agreeToTerms}</p>
            )}
          </div>

          {/* Submit error */}
          {submitError && (
            <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {submitError}
              {(creationUncertain || isAccountAlreadyExists(submitError)) && <Link to="/login" className="block mt-2 font-semibold underline">Sign in</Link>}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <Button variant="ghost" type="button" disabled={submitting} onClick={() => navigate("/styler-signup/photos")}>
              Back
            </Button>
            <Button
              text={
                uploadingImages
                  ? "Uploading photos…"
                  : submitting
                  ? "Creating account…"
                  : "Create account"
              }
              variant="primary"
              type="submit"
              disabled={isSubmitting || submitting || creationUncertain}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CreatePassword;
