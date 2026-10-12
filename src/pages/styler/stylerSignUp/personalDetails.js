import { Formik, Form } from "formik";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputWithLabel from "../../../components/inputWithLabel";
import Button from "../../../components/button";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { readStoredSignupEmail, storeSignupEmail } from "./signupFlow";
import { APIService } from "../../../hooks/remote/apiService";
import {
  NAME_MAX,
  PHONE_EXAMPLE,
  cleanName,
  formatCanadianPhone,
  nameError,
  phoneDigits,
  phoneError,
} from "../../../utils/signupValidation";

/* ── Zod schema ─────────────────────────────────────────────────────── */
// The name and phone rules are the shared sign-up rules, which are also the
// backend's, so a value accepted here is not refused at the last step.
const fieldRule = (check) => (val, ctx) => {
  const message = check(val);
  if (message) ctx.addIssue({ code: "custom", message });
};

const personalSchema = z.object({
  firstname: z.string().transform(cleanName).superRefine(fieldRule((v) => nameError(v, "first name"))),
  lastname: z.string().transform(cleanName).superRefine(fieldRule((v) => nameError(v, "last name"))),
  emailAddress: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phoneNumber: z.string().trim().superRefine(fieldRule((v) => phoneError(v))),
});

/* ── Convert Zod errors → Formik format ─────────────────────────────── */
function toFormikErrors(zodError) {
  const out = {};
  zodError.issues.forEach((issue) => {
    const field = issue.path[0];
    if (field && !out[field]) out[field] = issue.message;
  });
  return out;
}

/* ── Component ──────────────────────────────────────────────────────── */
const StylerPersonalDetails = () => {
  const navigate = useNavigate();
  const { formData, updateData } = useStylerSignup();
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const initialValues = {
    firstname: formData.firstname || "",
    lastname: formData.lastname || "",
    emailAddress: formData.emailAddress || readStoredSignupEmail(),
    phoneNumber: formData.phoneNumber || "",
  };

  const validate = (values) => {
    const result = personalSchema.safeParse(values);
    if (result.success) return {};
    return toFormikErrors(result.error);
  };

  const handleSubmit = async (values) => {
    setSending(true);
    setSubmitError("");
    values = personalSchema.parse(values);
    try {
      const res = await APIService.stylerGenerateOtp({ emailAddress: values.emailAddress });
      if (res.data?.statusCode === "200") {
        // Persist the signup email so a refresh mid-flow doesn't lose it.
        storeSignupEmail(values.emailAddress);
        updateData({ ...values, phoneNumber: phoneDigits(values.phoneNumber) });
        navigate("/styler-signup/verify-email");
      }
      else setSubmitError(res.data?.message || "Could not send a verification code. Please try again.");
    } catch (err) {
      setSubmitError("Could not send a verification code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={validate}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form>
          {/* The step's heading and lead come from the shell's step table, so
              every step is titled in one place rather than five. */}
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputWithLabel
                labelName="First name"
                inputType="text"
                placeholder="e.g. Jordan"
                inputName="firstname"
                autoComplete="given-name"
                maxLength={NAME_MAX}
                required
                inputValue={values.firstname}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={(touched.firstname || Boolean(values.firstname)) && errors.firstname ? errors.firstname : ""}
              />
              <InputWithLabel
                labelName="Last name"
                inputType="text"
                placeholder="e.g. Lee"
                inputName="lastname"
                autoComplete="family-name"
                maxLength={NAME_MAX}
                required
                inputValue={values.lastname}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={(touched.lastname || Boolean(values.lastname)) && errors.lastname ? errors.lastname : ""}
              />
            </div>
            <InputWithLabel
              labelName="Email address"
              inputType="email"
              placeholder="you@example.com"
              inputName="emailAddress"
              autoComplete="email"
              required
              inputValue={values.emailAddress}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={(touched.emailAddress || Boolean(values.emailAddress)) && errors.emailAddress ? errors.emailAddress : ""}
            />
            <InputWithLabel
              labelName="Phone number"
              inputType="tel"
              placeholder={`e.g. ${PHONE_EXAMPLE}`}
              inputName="phoneNumber"
              autoComplete="tel-national"
              inputMode="tel"
              required
              inputValue={values.phoneNumber}
              inputOnChange={(event) => handleChange({ target: { name: "phoneNumber", value: formatCanadianPhone(event.target.value) } })}
              inputOnBlur={handleBlur}
              inputError={(touched.phoneNumber || Boolean(values.phoneNumber)) && errors.phoneNumber ? errors.phoneNumber : ""}
            />
          </div>
          {submitError && <p role="alert" className="mt-4 text-sm text-red-600">{submitError}</p>}
          <div className="mt-8">
            <Button
              text={sending ? "Sending code..." : "Continue"}
              variant="primary"
              type="submit"
              disabled={isSubmitting || sending}
            />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default StylerPersonalDetails;
