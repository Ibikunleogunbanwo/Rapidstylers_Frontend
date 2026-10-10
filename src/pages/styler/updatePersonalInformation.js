import { useEffect, useState } from "react";
import Back from "../../components/goBack";
import Button from "../../components/button";
import InputWithLabel from "../../components/inputWithLabel";
import { Formik, Form } from "formik";
import { z } from "zod";
import { APIService } from "../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../utils/constant";

// Canadian phone helpers, shared with the sign-up step so a number the
// professional typed at sign-up and one they retype here read the same way.
const phoneDigits = (value) => (value || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "").slice(0, 10);
const formatCanadianPhone = (value) => {
  const digits = phoneDigits(value);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

// The rules the backend enforces (PERSON_NAME_REGEX, PHONE_NUMBER_VALIDATION_REGEX),
// so the form cannot accept a value the server then refuses.
const NAME_PATTERN = /^[A-Za-z][A-Za-z\s'-]*$/;
const schema = z.object({
  firstname: z
    .string()
    .trim()
    .min(1, "First name is required")
    .min(3, "First name must be at least 3 characters")
    .regex(NAME_PATTERN, "Use letters, spaces, hyphens or apostrophes"),
  lastname: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .min(3, "Last name must be at least 3 characters")
    .regex(NAME_PATTERN, "Use letters, spaces, hyphens or apostrophes"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => phoneDigits(value).length === 10, "Enter a valid Canadian phone number, e.g. (587) 555-1234"),
});

function toFormikErrors(zodError) {
  const out = {};
  zodError.issues.forEach((issue) => {
    const field = issue.path[0];
    if (field && !out[field]) out[field] = issue.message;
  });
  return out;
}

/**
 * The professional editing their own name and phone number. The email address
 * is shown but not editable: it is the sign-in and verification identity, and
 * changing it needs a code, so this screen names that rather than offering a
 * field the backend would ignore.
 */
const UpdatePersonalInformation = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    return APIService.getStylerOwnProfile()
      .then((response) => {
        const data = response.data?.data;
        if (!data || typeof data !== "object") throw new Error("Invalid response");
        setProfile(data);
      })
      .catch(() => setLoadError("Could not load your profile."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    document.title = "Personal information | RapidStylers";
    load();
  }, []);

  return (
    <div className="rounded-lg border border-black/10">
      <div className="flex items-center gap-3 border-b border-black/10 p-4 text-[11px] uppercase tracking-[0.25em] text-muted">
        <Back />
        <span>Personal information</span>
      </div>
      <div className="p-4">
        {loading ? (
          <p role="status" className="text-sm text-black/50">Loading your profile...</p>
        ) : loadError ? (
          <div role="alert" className="text-sm text-red-600">
            {loadError}{" "}
            <button type="button" className="text-brand underline" onClick={load}>
              Retry
            </button>
          </div>
        ) : (
          <PersonalInfoForm profile={profile} onSaved={setProfile} />
        )}
      </div>
    </div>
  );
};

// Mounted only once the profile is present, so formik's initialValues are
// computed from real data rather than frozen empty.
const PersonalInfoForm = ({ profile, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const initialValues = {
    firstname: profile.firstname || "",
    lastname: profile.lastname || "",
    phoneNumber: formatCanadianPhone(profile.phoneNumber || ""),
  };

  const validate = (values) => {
    const result = schema.safeParse(values);
    return result.success ? {} : toFormikErrors(result.error);
  };

  const handleSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const response = await APIService.updateStylerPersonalInfo({
        firstname: values.firstname.trim(),
        lastname: values.lastname.trim(),
        phoneNumber: phoneDigits(values.phoneNumber),
      });
      if (response.data?.statusCode === "200") {
        onSaved(response.data.data || profile);
        showSuccessToastMessage(response.data?.message || "Personal information saved");
      } else {
        setSaveError(response.data?.message || "Could not save your details.");
      }
    } catch {
      setSaveError("Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form>
          <div className="grid gap-4">
            <div className="grid gap-1 text-sm">
              <label htmlFor="styler-email" className="font-medium">Email address:</label>
              <input
                id="styler-email"
                type="email"
                value={profile.emailAddress || ""}
                readOnly
                disabled
                className="rounded-md border border-black/15 bg-black/5 px-3 py-2 text-sm text-black/60"
              />
              <span className="text-xs text-black/50">
                Your email is tied to how you sign in. Contact support to change it.
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputWithLabel
                labelName="First name"
                inputType="text"
                placeholder="e.g John"
                inputName="firstname"
                inputValue={values.firstname}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={(touched.firstname || Boolean(values.firstname)) && errors.firstname ? errors.firstname : ""}
              />
              <InputWithLabel
                labelName="Last name"
                inputType="text"
                placeholder="e.g Wick"
                inputName="lastname"
                inputValue={values.lastname}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={(touched.lastname || Boolean(values.lastname)) && errors.lastname ? errors.lastname : ""}
              />
            </div>

            <InputWithLabel
              labelName="Phone number"
              inputType="tel"
              placeholder="e.g. (587) 555-1234"
              inputName="phoneNumber"
              inputValue={values.phoneNumber}
              inputOnChange={(event) => handleChange({ target: { name: "phoneNumber", value: formatCanadianPhone(event.target.value) } })}
              inputOnBlur={handleBlur}
              inputError={(touched.phoneNumber || Boolean(values.phoneNumber)) && errors.phoneNumber ? errors.phoneNumber : ""}
            />

            {saveError && <p role="alert" className="text-sm text-red-600">{saveError}</p>}

            <div>
              <Button text={saving ? "Saving..." : "Save changes"} variant="primary" type="submit" disabled={isSubmitting || saving} />
            </div>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default UpdatePersonalInformation;
