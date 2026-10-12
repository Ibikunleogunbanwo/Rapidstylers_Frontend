import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Button from "../../components/button";
import PasswordInput from "../../components/passwordInput";
import PasswordRequirements from "../../components/passwordRequirements";
import { passwordProblem } from "../../utils/passwordRule";
import { showSuccessToastMessage } from "../../utils/constant";
import { stylerAccountError, updateStylerPassword } from "../../hooks/remote/stylerAccountApi";
import ProfileBackLink from "./stylerComponents/profileBackLink";

/**
 * The professional changing their own password. Same rule and messages as the
 * customer screen; on success every other device is signed out and this one
 * carries on with the fresh token the server returns.
 */
const StylerChangePassword = () => {
  const [saveError, setSaveError] = useState("");
  const form = useFormik({
    initialValues: { oldPassword: "", password: "", confirmPassword: "" },
    validationSchema: Yup.object({
      oldPassword: Yup.string().required("Old Password is required"),
      password: Yup.string()
        .required("New Password cannot be empty")
        .test("password-rule", ({ value }) => passwordProblem(value) || "", (value) => passwordProblem(value) === null),
      confirmPassword: Yup.string()
        .required("Confirm Password cannot be empty")
        .oneOf([Yup.ref("password"), null], "Passwords must match"),
    }),
    onSubmit: async (values, { resetForm }) => {
      setSaveError("");
      try {
        const body = await updateStylerPassword(values);
        resetForm();
        showSuccessToastMessage(body.message || "Password updated");
      } catch (error) {
        setSaveError(stylerAccountError(error, "Could not change your password. Please try again."));
      }
    },
  });
  const fieldError = (name) => (form.errors[name] && form.touched[name] ? form.errors[name] : null);

  return (
    <div className="rounded-lg border border-black/10">
      <div className="flex items-center gap-3 border-b border-black/10 p-4 text-[11px] uppercase tracking-[0.25em] text-muted">
        <ProfileBackLink />
        <span>Change password</span>
      </div>
      <form onSubmit={form.handleSubmit} noValidate className="p-4">
        <p className="text-sm text-black/60">
          Enter your current password, then choose the new one. You stay signed in here; other devices are signed out.
        </p>
        <div className="mt-4">
          <PasswordInput
            labelName="Old Password"
            inputName="oldPassword"
            inputValue={form.values.oldPassword}
            inputOnChange={form.handleChange}
            inputOnBlur={form.handleBlur}
            inputError={fieldError("oldPassword")}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <PasswordInput
            labelName="New Password"
            inputName="password"
            inputValue={form.values.password}
            inputOnChange={form.handleChange}
            inputOnBlur={form.handleBlur}
            inputError={fieldError("password")}
          />
          <PasswordInput
            labelName="Confirm Password"
            inputName="confirmPassword"
            inputValue={form.values.confirmPassword}
            inputOnChange={form.handleChange}
            inputOnBlur={form.handleBlur}
            inputError={fieldError("confirmPassword")}
          />
        </div>
        <PasswordRequirements value={form.values.password} />
        {saveError && <p role="alert" className="mt-4 text-sm text-red-600">{saveError}</p>}
        <div className="mt-6">
          <Button type="submit" variant="primary" text={form.isSubmitting ? "Updating..." : "Update Password"} disabled={form.isSubmitting} />
        </div>
      </form>
    </div>
  );
};

export default StylerChangePassword;
