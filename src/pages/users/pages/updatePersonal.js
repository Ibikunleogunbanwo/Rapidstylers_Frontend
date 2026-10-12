import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import { useFormik } from "formik";
import * as Yup from "yup";
import Button from "../../../components/button";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../components/spinner";
import { getUserDetails, updateUserDetails } from "../../../hooks/local/userReducer";
import { CITY_PATTERN, PERSON_NAME_PATTERN, POSTAL_CODE_PATTERN, PROVINCES, normalizePhone, phoneProblem, provinceName } from "./customerProfileRules";

/**
 * Best-effort parse of a stored Canadian address line like
 * "123 Main St, Unit 4, Toronto, ON M5V 2T6, Canada" back into
 * its components so the form can pre-fill the structured fields.
 */
const parseCanadianAddress = (full) => {
  if (!full) return {};
  const parts = full
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 3) return {};
  // The token carrying the postal code ("AB T2P 1B5" or just "T2P 1B5")
  let postalIdx = -1;
  parts.forEach((p, i) => {
    if (postalIdx === -1 && /[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/.test(p)) postalIdx = i;
  });
  if (postalIdx === -1) return {};
  const provPostal = parts[postalIdx];
  const pIdx = provPostal.search(/[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d/);
  return {
    street: parts.slice(0, postalIdx - 1).join(", "),
    city: postalIdx - 1 >= 0 ? parts[postalIdx - 1] : "",
    province: provPostal.slice(0, pIdx).trim(),
    postalCode: provPostal.slice(pIdx).toUpperCase().trim(),
    country: parts[postalIdx + 1] || "Canada",
  };
};

/** Canadian convention: "123 Main St, Unit 4, Toronto, ON M5V 2T6, Canada" */
const composeCanadianAddress = (v) =>
  [
    v.street,
    v.unit ? (/^(apt|unit|suite|#)/i.test(v.unit) ? v.unit : `Unit ${v.unit}`) : "",
    v.city,
    [v.province, v.postalCode].filter(Boolean).join(" "),
    v.country,
  ]
    .filter(Boolean)
    .join(", ");

const UpdateInformation = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Update personal information | RapidStylers";
  }));

  const dispatch = useDispatch();
  // userDetailsData can be null (fresh reload with a persisted session, or a
  // failed fetch) — never assume another page has loaded it first.
  const userDetails = useSelector((state) => state.user.userDetailsData)?.userData || null;
  const [fetching, setFetching] = useState(!userDetails);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    if (userDetails) return;
    let cancelled = false;
    setFetching(true);
    setFetchFailed(false);
    // Identity comes from the Bearer token — no arg needed.
    dispatch(getUserDetails())
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Update personal information</h1>
            <p className="mt-0.5 text-xs text-gray-500">Update your contact and address details</p>
          </div>
        </div>
      </div>

      {!userDetails && fetching && (
        <div className="p-10 text-center text-sm text-black/50">Loading your details...</div>
      )}
      {!userDetails && !fetching && fetchFailed && (
        <div className="p-10 text-center text-sm text-red-500">
          Could not load your details.{" "}
          <button
            type="button"
            className="text-brand underline"
            onClick={() => { setFetching(true); setFetchFailed(false); dispatch(getUserDetails()).catch(() => setFetchFailed(true)).finally(() => setFetching(false)); }}
          >
            Retry
          </button>
        </div>
      )}
      {userDetails && <UpdatePersonalForm userDetails={userDetails} />}
    </div>
  );
};

// A labelled field with the attributes the shared Input lacks (required
// marker, autocomplete, hint). Kept here so the form owns its own markup.
const Field = ({ form, name, label, required = false, hint, children, ...inputProps }) => {
  const error = form.touched[name] && form.errors[name] ? form.errors[name] : null;
  const id = `personal-${name}`;
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  const control = {
    id,
    name,
    value: form.values[name],
    onChange: form.handleChange,
    onBlur: form.handleBlur,
    required,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    className: "w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand disabled:text-black/50",
    ...inputProps,
  };
  return (
    <div>
      <div className="grid gap-1">
        <label htmlFor={id} className="font-medium text-sm">
          {label}
          {required && <span aria-hidden="true" className="ml-0.5 text-red-600">*</span>}
        </label>
        {children ? children(control) : <input type="text" {...control} />}
        {hint && <span id={`${id}-hint`} className="text-xs text-black/50">{hint}</span>}
      </div>
      <span id={`${id}-error`} className="text-xs text-red-500">{error}</span>
    </div>
  );
};

// Names are optional (Google sign-up creates accounts without them) but must
// be real names when given: letters in any script, spaces, ' - and periods.
const nameRule = (label) => Yup.string().trim()
  .max(50, `${label} must be 50 characters or fewer`)
  .test("person-name", `${label} can contain letters, spaces, apostrophes, hyphens and periods`, (value) => !value || PERSON_NAME_PATTERN.test(value));

// Rendered only once user details are present, so formik's initialValues are
// computed with real data (mounting the form later would freeze empty values).
const UpdatePersonalForm = ({ userDetails }) => {
  const dispatch = useDispatch();
  const parsed = parseCanadianAddress(userDetails.address || "");
  const updatePersonalInformation = useFormik({
    initialValues: {
      emailAddress: userDetails.emailAddress || "",
      firstname: userDetails.firstname || "",
      lastname: userDetails.lastname || "",
      phoneNumber: userDetails.phoneNumber || "",
      street: parsed.street || userDetails.address || "",
      unit: parsed.unit || "",
      city: parsed.city || "",
      province: provinceName(parsed.province) || provinceName(userDetails.state),
      postalCode: parsed.postalCode || "",
      country: "Canada",
    },
    validationSchema: Yup.object({
      firstname: nameRule("First name"),
      lastname: nameRule("Last name"),
      phoneNumber: Yup.string()
        .test("phone", (params) => phoneProblem(params.value) || "Enter a valid phone number", (value) => phoneProblem(value) === null),
      street: Yup.string().trim().required('Street address is required'),
      city: Yup.string().trim()
        .required('City is required')
        .test("city", "Enter a city name using letters (for example Calgary)", (value) => !value || CITY_PATTERN.test(value)),
      province: Yup.string()
        .required('Province or territory is required')
        .oneOf(PROVINCES.map((p) => p.name), 'Choose a province or territory'),
      postalCode: Yup.string().trim()
        .matches(POSTAL_CODE_PATTERN, 'Enter a valid Canadian postal code (e.g. T2P 1B5)')
        .required('Postal code is required'),
    }),
    onSubmit: async (values) => {
        const trimmed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
        const { emailAddress, firstname, lastname } = trimmed;
        const postalCode = trimmed.postalCode.toUpperCase().replace(/^([A-Z]\d[A-Z])[ -]?(\d[A-Z]\d)$/, "$1 $2");
        // Persist the single-line address in Canadian convention — the backend
        // stores address + state (province) + country for user accounts.
        const address = composeCanadianAddress({ ...trimmed, postalCode, country: "Canada" });
        let updateUserData = {emailAddress, phoneNumber: normalizePhone(trimmed.phoneNumber), firstname, lastname, country: "Canada", address, state: trimmed.province};
        const { payload } = await(dispatch(updateUserDetails(updateUserData)));
        if(payload?.statusCode === "200") {
          dispatch(getUserDetails());
        }
    },
  });
  const form = updatePersonalInformation;
  return (
    <form onSubmit={form.handleSubmit} noValidate>
      <p className="px-4 pt-4 text-xs text-black/55">Fields marked <span aria-hidden="true" className="text-red-600">*</span><span className="sr-only">with an asterisk</span> are required.</p>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field form={form} name="emailAddress" label="Email" type="email" autoComplete="email" disabled
          hint="Your sign-in email. Contact support to change it." />
        <Field form={form} name="phoneNumber" label="Phone number" type="tel" autoComplete="tel-national" inputMode="tel"
          placeholder="403 555 0123" hint="10 digits, Canadian number" />
        <Field form={form} name="firstname" label="First name" autoComplete="given-name" maxLength={50} />
        <Field form={form} name="lastname" label="Last name" autoComplete="family-name" maxLength={50} />

        {/* Google Places search — auto-computes every Canadian field below */}
        <div className="col-span-1 md:col-span-2">
          <AddressAutocomplete
            label="Find your address:"
            value={form.values.street}
            placeholder={"Start typing your address…"}
            onChange={(data) => {
              // Free-text edits carry only the raw line — update the street without
              // wiping the computed Canadian fields. A real Places selection carries
              // parsed components, so it recomputes everything.
              const isSelection = !!(data.city || data.province || data.postalCode);
              form.setFieldValue("street", data.streetAddress || data.formattedAddress || "");
              if (isSelection) {
                form.setFieldValue("unit", data.unit || "");
                form.setFieldValue("city", data.city || "");
                form.setFieldValue("province", provinceName(data.province));
                form.setFieldValue("postalCode", (data.postalCode || "").toUpperCase());
                ["street", "city", "province", "postalCode"].forEach((f) =>
                  form.setFieldTouched(f, true, false)
                );
              }
            }}
          />
        </div>

        <Field form={form} name="street" label="Street address" required autoComplete="address-line1" />
        <Field form={form} name="unit" label="Unit / Apt / Suite" placeholder="Optional" autoComplete="address-line2" />
        <Field form={form} name="city" label="City" required autoComplete="address-level2" maxLength={60} />
        <Field form={form} name="province" label="Province or territory" required>
          {(control) => (
            <select {...control} autoComplete="address-level1">
              <option value="" disabled>Choose a province or territory</option>
              {PROVINCES.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
            </select>
          )}
        </Field>
        <Field form={form} name="postalCode" label="Postal code" required autoComplete="postal-code" placeholder="T2P 1B5" maxLength={7} />
        {/* RapidStylers serves Canada only, so the country is fixed. */}
        <Field form={form} name="country" label="Country">
          {(control) => (
            <select {...control} disabled autoComplete="country-name">
              <option value="Canada">Canada</option>
            </select>
          )}
        </Field>
        <div>
          <Button variant="primary" text={"Update Information"} type={"submit"} /></div>
      </div>
    </form>
  );
};

export default UpdateInformation;
