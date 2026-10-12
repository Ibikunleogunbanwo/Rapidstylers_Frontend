import { Formik, Form } from "formik";
import { z } from "zod";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputWithLabel from "../../../components/inputWithLabel";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import Button from "../../../components/button";
import { APIService } from "../../../hooks/remote/apiService";
import { useStylerSignup } from "../../../context/StylerSignupContext";
import ProvinceSelect from "../../../components/provinceSelect";
import {
  CITY_MAX,
  cityError,
  formatPostalCode,
  postalCodeError,
  provinceError,
  toProvinceName,
} from "../../../utils/signupValidation";

/* ── Zod schema ─────────────────────────────────────────────────────── */
const fieldRule = (check) => (val, ctx) => {
  const message = check(val);
  if (message) ctx.addIssue({ code: "custom", message });
};

const businessSchema = z.object({
  serviceTypeId: z.string().min(1, "Select a service type"),
  businessName: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .min(3, "Business name must be at least 3 characters"),
  address: z.string().trim().min(1, "Business address is required"),
  // The shared sign-up rules, which the backend applies to the same fields.
  city: z.string().superRefine(fieldRule(cityError)),
  province: z.string().superRefine(fieldRule(provinceError)),
  postalCode: z.string().superRefine(fieldRule(postalCodeError)),
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
const BusinessDetails = () => {
  const navigate = useNavigate();
  const { formData, updateData } = useStylerSignup();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadServiceTypes = () => {
    setLoading(true);
    APIService.getStylerType()
      .then((res) => {
        const items = Array.isArray(res.data?.data) ? res.data.data : [];
        setServiceTypes(
          items.filter(c => c && typeof c === "object").map((c) => ({
            id: String(c.serviceTypeId ?? c.id ?? ""),
            name: c.serviceTypeName || c.serviceName || c.name,
          })).filter(c => c.id && c.name)
        );
      })
      .catch(() => setServiceTypes([]))
      .finally(() => setLoading(false));
  };
  useEffect(loadServiceTypes, []);

  const initialValues = {
    serviceTypeId: formData.serviceTypeId || "",
    serviceTypeName: formData.serviceTypeName || "",
    businessName: formData.businessName || "",
    address: formData.address || "",
    businessAddress: formData.businessAddress || "",
    city: formData.city || "",
    province: toProvinceName(formData.businessProvince || formData.province),
    postalCode: formData.postalCode || "",
    streetAddress: formData.streetAddress || "",
    unit: formData.unit || "",
    latitude: formData.latitude || null,
    longitude: formData.longitude || null,
    country: formData.country || "Canada",
    state: formData.state || "",
  };

  const validate = (values) => {
    const result = businessSchema.safeParse({
      serviceTypeId: values.serviceTypeId,
      businessName: values.businessName,
      address: values.address,
      city: values.city,
      province: values.province,
      postalCode: values.postalCode,
    });
    if (result.success) return {};
    return toFormikErrors(result.error);
  };

  const handleAddressChange = (setValues) => (addressData) => {
    // Use the functional form so we never clobber fields the user edited
    // while the address autocomplete was open.
    setValues((prev) => ({
      ...prev,
      // Keep already-filled manual values when Places returns nothing for a
      // part (e.g. free-typed fallback has no city/province/postal code).
      address: addressData.formattedAddress || prev.address || "",
      businessAddress: addressData.formattedAddress || prev.businessAddress || "",
      city: addressData.city || prev.city || "",
      province: toProvinceName(addressData.province) || prev.province || "",
      businessProvince: toProvinceName(addressData.province) || prev.businessProvince || "",
      state: toProvinceName(addressData.province) || prev.state || "",
      postalCode: formatPostalCode(addressData.postalCode) || prev.postalCode || "",
      streetAddress: addressData.streetAddress || prev.streetAddress || "",
      unit: addressData.unit || prev.unit || "",
      latitude: addressData.latitude ?? prev.latitude ?? null,
      longitude: addressData.longitude ?? prev.longitude ?? null,
      country: addressData.country || prev.country || "Canada",
    }));
  };

  const handleSubmit = (values) => {
    const selected = serviceTypes.find((s) => s.id === values.serviceTypeId);
    updateData({
      ...values,
      city: values.city.trim(),
      postalCode: formatPostalCode(values.postalCode),
      serviceTypeName: selected?.name || values.serviceTypeName,
      businessProvince: values.province,
      businessAddress: values.address,
      state: values.province,
    });
    navigate("/styler-signup/photos");
  };

  return (
    <Formik
      initialValues={initialValues}
      validate={validate}
      onSubmit={handleSubmit}
    >
      {({ values, errors, touched, handleChange, handleBlur, setFieldValue, setValues, isSubmitting }) => (
        <Form>
          {/* The step's heading and lead come from the shell's step table. */}

          {/* Service type selector */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {loading ? (
              <p className="col-span-2 text-sm text-black/55">
                Loading service categories…
              </p>
            ) : serviceTypes.length > 0 ? (
              serviceTypes.map((svc) => (
                <label
                  key={svc.id}
                  className={`text-sm text-center rounded-lg p-3 cursor-pointer border transition-colors ${
                    values.serviceTypeId === svc.id
                      ? "border-brand bg-brand/10 text-brand font-medium"
                      : "border-black/15 text-black/70 hover:border-black/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceTypeId"
                    value={svc.id}
                    checked={values.serviceTypeId === svc.id}
                    onChange={() => {
                      setFieldValue("serviceTypeId", svc.id);
                      setFieldValue("serviceTypeName", svc.name);
                    }}
                    className="sr-only"
                  />
                  I'm a {svc.name}
                </label>
              ))
            ) : (
              <div className="col-span-2 text-sm text-black/55" role="status">
                Service options are unavailable.
                <button type="button" className="block mt-2 text-brand underline" onClick={loadServiceTypes}>Retry loading services</button>
              </div>
            )}
          </div>
          {touched.serviceTypeId && errors.serviceTypeId && (
            <p className="text-red-500 text-xs mb-3">{errors.serviceTypeId}</p>
          )}

          <div className="grid gap-4">
            <InputWithLabel
              labelName="Business name"
              inputType="text"
              placeholder="e.g. Glow Studio"
              inputName="businessName"
              autoComplete="organization"
              required
              inputValue={values.businessName}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={(touched.businessName || Boolean(values.businessName)) && errors.businessName ? errors.businessName : ""}
            />

            <div>
              <span className="font-medium text-sm pb-1 block">Business address:</span>
              <AddressAutocomplete
                placeholder="Start typing your business address…"
                value={values.address}
                onChange={handleAddressChange(setValues)}
              />
              {/* Say who reads this and why. Clients are given this address to
                  travel to, and a profile without one cannot be listed, so it
                  is the last field a professional should treat as optional. */}
              <p className="mt-1.5 text-xs leading-[1.5] text-black/55">
                Clients travel here when they book a visit. This address appears on your public
                profile and booking confirmations. Enter the address where you provide services.
              </p>
              {touched.address && errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            {/* Always visible so a free-typed address can be completed
                manually when Places suggestions are unavailable. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              <InputWithLabel
                labelName="City"
                inputType="text"
                inputName="city"
                autoComplete="address-level2"
                maxLength={CITY_MAX}
                required
                inputValue={values.city}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={(touched.city || Boolean(values.city)) && errors.city ? errors.city : ""}
              />
              <ProvinceSelect
                value={values.province}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                error={touched.province && errors.province ? errors.province : ""}
              />
              <InputWithLabel
                labelName="Postal code"
                inputType="text"
                inputName="postalCode"
                placeholder="e.g. T2P 1B5"
                autoComplete="postal-code"
                maxLength={7}
                required
                inputValue={values.postalCode}
                inputOnChange={handleChange}
                inputOnBlur={(event) => {
                  setFieldValue("postalCode", formatPostalCode(event.target.value));
                  handleBlur(event);
                }}
                inputError={(touched.postalCode || Boolean(values.postalCode)) && errors.postalCode ? errors.postalCode : ""}
              />
            </div>
          </div>

          <Link to="/faqs" target="_blank" className="inline-block mt-6 text-sm text-brand underline">Read the professional FAQ</Link>

          <div className="mt-8 flex gap-3">
            <Button variant="ghost" type="button" onClick={() => navigate("/styler-signup/verify-email")}>
              Back
            </Button>
            <Button text="Continue" variant="primary" type="submit" disabled={isSubmitting} />
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default BusinessDetails;
