import { useEffect, useState } from "react";
import Button from "../../components/button";
import AddressAutocomplete from "../../components/AddressAutocomplete";
import { Formik, Form } from "formik";
import { z } from "zod";
import { APIService } from "../../hooks/remote/apiService";
import { showSuccessToastMessage } from "../../utils/constant";
import ProfileBackLink from "./stylerComponents/profileBackLink";
import { StylerField, StylerSelect } from "./stylerComponents/stylerField";
import {
  CANADIAN_TIME_ZONES,
  CITY_MESSAGE,
  CITY_PATTERN,
  POSTAL_CODE_MESSAGE,
  POSTAL_CODE_PATTERN,
  PROVINCES,
  provinceName,
} from "./stylerComponents/profileRules";

// The limits the backend enforces on StylerBusinessInfoData, so the form cannot
// accept a value the server then refuses. Kept as one place so the fields and
// the schema cannot drift apart.
const LIMITS = { businessName: 100, description: 1000, streetAddress: 200, unit: 50, city: 60 };
const PROVINCE_NAMES = PROVINCES.map((province) => province.name);

const schema = z.object({
  serviceTypeId: z.string().min(1, "Select a service type"),
  businessName: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(LIMITS.businessName, `Keep the business name under ${LIMITS.businessName} characters`),
  description: z
    .string()
    .trim()
    .max(LIMITS.description, `Keep the description under ${LIMITS.description} characters`)
    .optional(),
  streetAddress: z
    .string()
    .trim()
    .min(1, "Street address is required")
    .max(LIMITS.streetAddress, `Keep the street address under ${LIMITS.streetAddress} characters`),
  unit: z.string().trim().max(LIMITS.unit, `Keep the unit under ${LIMITS.unit} characters`).optional(),
  city: z.string().trim().min(1, "City is required").regex(CITY_PATTERN, CITY_MESSAGE),
  province: z.string().refine((value) => PROVINCE_NAMES.includes(value), "Select a province or territory"),
  // Optional, as before, but a value must be a real Canadian postal code.
  postalCode: z
    .string()
    .trim()
    .refine((value) => value === "" || POSTAL_CODE_PATTERN.test(value), POSTAL_CODE_MESSAGE)
    .optional(),
  country: z.literal("Canada", { error: "RapidStylers is available in Canada only" }),
  timeZone: z.string().trim().max(64, "Time zone is not valid").optional(),
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
 * The professional editing their business name, description, service type and
 * address. A moved address is located again on save, so the customer-facing
 * travel estimate stays right, and the time zone follows the new address unless
 * the professional names one here.
 */
const UpdateBusinessInformation = () => {
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
    document.title = "Business information | RapidStylers";
    load();
  }, []);

  return (
    <div className="rounded-lg border border-black/10">
      <div className="flex items-center gap-3 border-b border-black/10 p-4 text-[11px] uppercase tracking-[0.25em] text-muted">
        <ProfileBackLink />
        <span>Business information</span>
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
          <BusinessInfoForm profile={profile} onSaved={setProfile} />
        )}
      </div>
    </div>
  );
};

const BusinessInfoForm = ({ profile, onSaved }) => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadServiceTypes = () => {
    setTypesLoading(true);
    APIService.getStylerType()
      .then((response) => {
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        setServiceTypes(
          items
            .filter((item) => item && typeof item === "object")
            .map((item) => ({ id: String(item.serviceTypeId ?? item.id ?? ""), name: item.serviceTypeName || item.serviceName || item.name }))
            .filter((item) => item.id && item.name)
        );
      })
      .catch(() => setServiceTypes([]))
      .finally(() => setTypesLoading(false));
  };
  useEffect(loadServiceTypes, []);

  const initialValues = {
    serviceTypeId: profile.serviceTypeId ? String(profile.serviceTypeId) : "",
    businessName: profile.businessName || "",
    description: profile.description || "",
    businessAddress: profile.businessAddress || "",
    streetAddress: profile.streetAddress || "",
    unit: profile.unit || "",
    city: profile.city || "",
    // Stored rows may hold a code ("AB"); the dropdown speaks full names.
    province: provinceName(profile.province),
    postalCode: profile.postalCode || "",
    country: "Canada",
    timeZone: profile.timeZone || "",
  };

  const validate = (values) => {
    const result = schema.safeParse(values);
    return result.success ? {} : toFormikErrors(result.error);
  };

  const handleAddressChange = (setFieldValue) => (data) => {
    // A real Places selection fills every structured field; a free-typed line
    // only updates the street so the computed fields are never wiped.
    setFieldValue("businessAddress", data.formattedAddress || data.streetAddress || "");
    if (data.city || data.province || data.postalCode) {
      setFieldValue("streetAddress", data.streetAddress || "");
      setFieldValue("unit", data.unit || "");
      setFieldValue("city", data.city || "");
      setFieldValue("province", provinceName(data.province));
      setFieldValue("postalCode", data.postalCode || "");
    } else {
      setFieldValue("streetAddress", data.streetAddress || data.formattedAddress || "");
    }
  };

  const handleSubmit = async (values) => {
    if (saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const response = await APIService.updateStylerBusinessInfo({
        businessName: values.businessName.trim(),
        description: values.description ? values.description.trim() : "",
        serviceTypeId: values.serviceTypeId,
        streetAddress: values.streetAddress.trim(),
        unit: values.unit ? values.unit.trim() : "",
        city: values.city.trim(),
        province: values.province,
        postalCode: values.postalCode ? values.postalCode.trim().toUpperCase() : "",
        country: "Canada",
        // Blank keeps whatever zone the address implies; a value makes it the
        // professional's own choice, which then stays theirs.
        timeZone: values.timeZone ? values.timeZone.trim() : "",
      });
      if (response.data?.statusCode === "200") {
        onSaved(response.data.data || profile);
        showSuccessToastMessage(response.data?.message || "Business information saved");
      } else {
        setSaveError(response.data?.message || "Could not save your business details.");
      }
    } catch (error) {
      setSaveError(error?.response?.data?.message || "Could not save your business details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit} enableReinitialize>
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
        <Form noValidate>
          <div className="grid gap-5">
            <div>
              <span className="font-medium text-sm block">Service type</span>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {typesLoading ? (
                  <p className="col-span-2 text-sm text-black/55">Loading service categories…</p>
                ) : serviceTypes.length > 0 ? (
                  serviceTypes.map((service) => (
                    <label
                      key={service.id}
                      className={`rounded-lg border p-3 text-center text-sm transition-colors cursor-pointer ${
                        values.serviceTypeId === service.id
                          ? "border-brand bg-brand/10 font-medium text-brand"
                          : "border-black/15 text-black/70 hover:border-black/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceTypeId"
                        value={service.id}
                        checked={values.serviceTypeId === service.id}
                        onChange={() => setFieldValue("serviceTypeId", service.id)}
                        className="sr-only"
                      />
                      I'm a {service.name}
                    </label>
                  ))
                ) : (
                  <div className="col-span-2 text-sm text-black/55" role="status">
                    Service options are unavailable.
                    <button type="button" className="mt-2 block text-brand underline" onClick={loadServiceTypes}>
                      Retry loading services
                    </button>
                  </div>
                )}
              </div>
              {touched.serviceTypeId && errors.serviceTypeId && <p className="mt-2 text-xs text-red-500">{errors.serviceTypeId}</p>}
            </div>

            <StylerField
              label="Business name"
              placeholder="The continental"
              name="businessName"
              autoComplete="organization"
              required
              maxLength={LIMITS.businessName}
              value={values.businessName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={(touched.businessName || Boolean(values.businessName)) && errors.businessName ? errors.businessName : ""}
            />

            <label className="grid gap-1 text-sm">
              <span className="font-medium">Description:</span>
              <textarea
                name="description"
                rows={4}
                maxLength={LIMITS.description}
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="What clients should know before booking you"
                className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-brand focus-visible:outline-brand"
              />
              <span className="text-xs text-black/50">{values.description.length}/{LIMITS.description} characters</span>
              {touched.description && errors.description && <span className="text-xs text-red-500">{errors.description}</span>}
            </label>

            {/* One address flow: search to fill the fields, then check or edit them. */}
            <fieldset className="grid gap-3">
              <legend className="font-medium text-sm pb-1">Business address</legend>
              <p className="-mt-1 text-xs leading-[1.5] text-black/55">
                Clients travel here when they book a visit, so this address is on your public profile. Moved? Search
                for the new address to fill the fields below, or edit them directly.
              </p>
              <AddressAutocomplete
                label="Find a new address"
                placeholder="Start typing to search…"
                onChange={handleAddressChange(setFieldValue)}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <StylerField
                  label="Street address"
                  name="streetAddress"
                  autoComplete="address-line1"
                  required
                  maxLength={LIMITS.streetAddress}
                  value={values.streetAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={(touched.streetAddress || Boolean(values.streetAddress)) && errors.streetAddress ? errors.streetAddress : ""}
                />
                <StylerField
                  label="Unit / Apt / Suite"
                  placeholder="Optional"
                  name="unit"
                  autoComplete="address-line2"
                  maxLength={LIMITS.unit}
                  value={values.unit}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={(touched.unit || Boolean(values.unit)) && errors.unit ? errors.unit : ""}
                />
                <StylerField
                  label="City"
                  name="city"
                  autoComplete="address-level2"
                  required
                  maxLength={LIMITS.city}
                  value={values.city}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={(touched.city || Boolean(values.city)) && errors.city ? errors.city : ""}
                />
                <StylerSelect
                  label="Province"
                  name="province"
                  autoComplete="address-level1"
                  required
                  placeholder="Select a province or territory"
                  options={PROVINCES.map((province) => ({ value: province.name, label: province.name }))}
                  value={values.province}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.province && errors.province ? errors.province : ""}
                />
                <StylerField
                  label="Postal code"
                  name="postalCode"
                  placeholder="e.g. T2P 1B5"
                  autoComplete="postal-code"
                  maxLength={7}
                  value={values.postalCode}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={(touched.postalCode || Boolean(values.postalCode)) && errors.postalCode ? errors.postalCode : ""}
                />
                <StylerSelect
                  label="Country"
                  name="country"
                  autoComplete="country-name"
                  options={[{ value: "Canada", label: "Canada" }]}
                  hint="RapidStylers is available in Canada only."
                  value={values.country}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={errors.country || ""}
                />
              </div>
            </fieldset>

            <StylerSelect
              label="Time zone (optional)"
              name="timeZone"
              placeholder="Follow my address"
              options={[
                ...CANADIAN_TIME_ZONES.map((zone) => ({ value: zone.id, label: zone.label })),
                // Keep a saved zone outside the list selectable rather than silently dropping it.
                ...(values.timeZone && !CANADIAN_TIME_ZONES.some((zone) => zone.id === values.timeZone)
                  ? [{ value: values.timeZone, label: values.timeZone }]
                  : []),
              ]}
              hint="Leave it on “Follow my address” to use the time zone that goes with your address. Choose one only if you work in a different zone."
              value={values.timeZone}
              onChange={handleChange}
              onBlur={handleBlur}
              error={(touched.timeZone || Boolean(values.timeZone)) && errors.timeZone ? errors.timeZone : ""}
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

export default UpdateBusinessInformation;
