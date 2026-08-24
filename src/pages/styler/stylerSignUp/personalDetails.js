import { Formik, Form } from "formik";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputWithLabel from "../../../components/inputWithLabel";
import Buttons from "../../../components/button";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import { APIService } from "../../../hooks/remote/apiService";

/* ── Zod schema ─────────────────────────────────────────────────────── */
const personalSchema = z.object({
  firstname: z
    .string()
    .min(1, "First name is required")
    .min(3, "First name must be at least 3 characters"),
  lastname: z
    .string()
    .min(1, "Last name is required")
    .min(3, "Last name must be at least 3 characters"),
  emailAddress: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9]+$/, "Phone number can only contain digits")
    .refine(
      (val) => val.length === 10 || val.length === 11,
      "Enter a valid Canadian phone number (10 digits, or 11 with leading 1)"
    )
    .refine(
      (val) => val.length !== 11 || val.startsWith("1"),
      "11-digit numbers must start with 1"
    ),
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

  const initialValues = {
    firstname: formData.firstname || "",
    lastname: formData.lastname || "",
    emailAddress: formData.emailAddress || sessionStorage.getItem("stylerSignupEmail") || "",
    phoneNumber: formData.phoneNumber || "",
  };

  const validate = (values) => {
    const result = personalSchema.safeParse(values);
    if (result.success) return {};
    return toFormikErrors(result.error);
  };

  const handleSubmit = async (values) => {
    setSending(true);
    try {
      const res = await APIService.stylerGenerateOtp({ emailAddress: values.emailAddress });
      if (res.data?.statusCode === "200") {
        // Persist the signup email so a refresh mid-flow doesn't lose it.
        sessionStorage.setItem("stylerSignupEmail", values.emailAddress);
        updateData(values);
        navigate("/styler-signup/verify-email");
      }
      // Error toasts are handled by APIService.extractError
    } catch (err) {
      // Error already toasted
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
          <p className="my-4 font-bold">Create an account:</p>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputWithLabel
                labelName="First name"
                inputType="text"
                placeholder="e.g John"
                inputName="firstname"
                inputValue={values.firstname}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={touched.firstname && errors.firstname ? errors.firstname : ""}
              />
              <InputWithLabel
                labelName="Last name"
                inputType="text"
                placeholder="e.g Wick"
                inputName="lastname"
                inputValue={values.lastname}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={touched.lastname && errors.lastname ? errors.lastname : ""}
              />
            </div>
            <InputWithLabel
              labelName="Email address"
              inputType="email"
              placeholder="babayaga@gmail.com"
              inputName="emailAddress"
              inputValue={values.emailAddress}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={touched.emailAddress && errors.emailAddress ? errors.emailAddress : ""}
            />
            <InputWithLabel
              labelName="Phone number"
              inputType="tel"
              placeholder="e.g. 5875551234"
              inputName="phoneNumber"
              inputValue={values.phoneNumber}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : ""}
            />
          </div>
          <div className="mt-8">
            <Buttons
              btnText={sending ? "Sending code..." : "Continue"}
              btnType="primary"
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
