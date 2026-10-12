import { useEffect, useState } from "react";
import Button from "../../components/button";
import { Formik, Form } from "formik";
import { z } from "zod";
import { APIService } from "../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../utils/constant";
import ProfileBackLink from "./stylerComponents/profileBackLink";
import { StylerField } from "./stylerComponents/stylerField";
import {
  PERSON_NAME_MESSAGE,
  PERSON_NAME_PATTERN,
  canadianPhone,
  formatCanadianPhone,
  phoneProblem,
} from "./stylerComponents/profileRules";

// The shared name and phone rules (contracts.md), so the form cannot accept a
// value the server then refuses, and extra phone digits show as an error
// instead of being cut off.
const nameField = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be 50 characters or fewer`)
    .regex(PERSON_NAME_PATTERN, PERSON_NAME_MESSAGE);
const schema = z.object({
  firstname: nameField("First name"),
  lastname: nameField("Last name"),
  phoneNumber: z.string().superRefine((value, ctx) => {
    const problem = phoneProblem(value);
    if (problem) ctx.addIssue({ code: "custom", message: problem });
  }),
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
        <ProfileBackLink />
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
        phoneNumber: canadianPhone(values.phoneNumber),
      });
      if (response.data?.statusCode === "200") {
        onSaved(response.data.data || profile);
        showSuccessToastMessage(response.data?.message || "Personal information saved");
      } else {
        setSaveError(response.data?.message || "Could not save your details.");
      }
    } catch (error) {
      setSaveError(error?.response?.data?.message || "Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
        <Form noValidate>
          <div className="grid gap-4">
            <p className="text-xs text-black/55"><span aria-hidden="true" className="text-red-600">*</span> Required field</p>
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
              <StylerField
                label="First name"
                placeholder="e.g. John"
                name="firstname"
                autoComplete="given-name"
                required
                maxLength={50}
                value={values.firstname}
                onChange={handleChange}
                onBlur={handleBlur}
                error={(touched.firstname || Boolean(values.firstname)) && errors.firstname ? errors.firstname : ""}
              />
              <StylerField
                label="Last name"
                placeholder="e.g. Wick"
                name="lastname"
                autoComplete="family-name"
                required
                maxLength={50}
                value={values.lastname}
                onChange={handleChange}
                onBlur={handleBlur}
                error={(touched.lastname || Boolean(values.lastname)) && errors.lastname ? errors.lastname : ""}
              />
            </div>

            <StylerField
              label="Phone number"
              type="tel"
              placeholder="e.g. (587) 555-1234"
              name="phoneNumber"
              autoComplete="tel"
              inputMode="tel"
              required
              value={values.phoneNumber}
              onChange={(event) => handleChange({ target: { name: "phoneNumber", value: formatCanadianPhone(event.target.value) } })}
              onBlur={handleBlur}
              error={(touched.phoneNumber || Boolean(values.phoneNumber)) && errors.phoneNumber ? errors.phoneNumber : ""}
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
