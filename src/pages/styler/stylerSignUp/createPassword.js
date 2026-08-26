import { Formik, Form } from "formik";
import { z } from "zod";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Buttons from "../../../components/button";
import InputWithLabel from "../../../components/inputWithLabel";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { APIService } from "../../../hooks/remote/apiService";
import { uploadToCloudinary, deleteCloudinaryImage } from "../../../utils/cloudinaryUpload";
import { showSuccessToastMessage } from "../../../utils/constant";

/* ── Zod schema (matches backend PASSWORD_PATTERN) ──────────────────── */
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
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
  const { formData, imageFiles } = useStylerSignup();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  /** Best-effort removal of images uploaded but not attached to an account. */
  const cleanupUploadedImages = async (uploads) => {
    for (const u of uploads) {
      if (u?.publicId) await deleteCloudinaryImage(u.publicId);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    setSubmitError("");

    // The single commit point: upload the picked images to Cloudinary and
    // create the account. Nothing reaches Cloudinary before this step, so
    // abandoning the wizard never leaves orphaned images. If the account
    // creation fails after the upload, the images are deleted again.
    let uploaded = [];
    try {
      setUploadingImages(true);
      const jobs = [];
      if (imageFiles.profileImageFile) {
        jobs.push(uploadToCloudinary(imageFiles.profileImageFile, "profile"));
      }
      if (imageFiles.identificationImageFile) {
        jobs.push(uploadToCloudinary(imageFiles.identificationImageFile, "id"));
      }
      const results = await Promise.all(jobs);
      uploaded = results.filter(Boolean);

      const profileImageUrl = results[0]?.url || formData.profileImageUrl || "";
      const identificationImageUrl =
        results[1]?.url || formData.identificationImageUrl || "";

      // Merge password with all previous step data. identificationTypeId must
      // be a real numeric id from list_identification (the backend parses it
      // as a Long) — never default it here or the request will 500.
      const payload = {
        ...formData,
        password: values.password,
        agreeToTerms: values.agreeToTerms === true,
        profileImageUrl,
        identificationImageUrl,
      };

      const res = await APIService.createStyler(payload);
      if (res.data?.statusCode === "200") {
        showSuccessToastMessage("Account created! You can now sign in.");
        navigate("/login");
      } else {
        setSubmitError(res.data?.message || "Registration failed. Please try again.");
        await cleanupUploadedImages(uploaded);
      }
    } catch (err) {
      // APIService.extractError already shows a toast, but set inline too
      setSubmitError("Registration failed. Please check your details and try again.");
      await cleanupUploadedImages(uploaded);
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
          <p className="my-4 font-bold">Create your password:</p>
          <div className="grid gap-4">
            <InputWithLabel
              labelName="Set password"
              inputType="password"
              placeholder="Enter a strong password"
              inputName="password"
              inputValue={values.password}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={touched.password && errors.password ? errors.password : ""}
            />
            <InputWithLabel
              labelName="Confirm password"
              inputType="password"
              placeholder="Re-enter your password"
              inputName="confirmPassword"
              inputValue={values.confirmPassword}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : ""}
            />
          </div>

          {/* Password requirements hint */}
          <div className="mt-4 text-[12px] text-gray-500 leading-relaxed space-y-1">
            <p className="font-medium text-gray-600">Password must contain:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li className={values.password.length >= 8 ? "text-green-600" : ""}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(values.password) ? "text-green-600" : ""}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(values.password) ? "text-green-600" : ""}>
                One lowercase letter
              </li>
              <li className={/[0-9]/.test(values.password) ? "text-green-600" : ""}>
                One digit
              </li>
              <li className={/[^A-Za-z0-9]/.test(values.password) ? "text-green-600" : ""}>
                One special character
              </li>
            </ul>
          </div>

          {/* Terms and conditions */}
          <div className="mt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={values.agreeToTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-gray-600">
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
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {submitError}
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/styler-signup/photos")}
              className="py-3 px-5 text-sm text-gray-600 font-medium border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <Buttons
              btnText={
                uploadingImages
                  ? "Uploading photos…"
                  : submitting
                  ? "Creating account…"
                  : "Create account"
              }
              btnType="primary"
              type="submit"
              disabled={isSubmitting || submitting}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CreatePassword;
