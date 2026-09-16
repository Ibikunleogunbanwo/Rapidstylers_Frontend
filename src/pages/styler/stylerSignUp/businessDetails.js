import { Formik, Form } from "formik";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InputWithLabel from "../../../components/inputWithLabel";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import Button from "../../../components/button";
import GoodToKnow from "../../../components/goodToKnow";
import { APIService } from "../../../hooks/remote/apiService";
import { useStylerSignup } from "../../../context/StylerSignupContext";

/* ── Zod schema ─────────────────────────────────────────────────────── */
const businessSchema = z.object({
  serviceTypeId: z.string().min(1, "Select a service type"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .min(3, "Business name must be at least 3 characters"),
  address: z.string().min(1, "Business address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z.string().min(1, "Postal code is required"),
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

  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setServiceTypes(
          items.map((c) => ({
            id: c.serviceTypeId || c.id,
            name: c.serviceTypeName || c.serviceName || c.name,
          }))
        );
      })
      .catch(() => setServiceTypes([]))
      .finally(() => setLoading(false));
  }, []);

  const initialValues = {
    serviceTypeId: formData.serviceTypeId || "",
    serviceTypeName: formData.serviceTypeName || "",
    businessName: formData.businessName || "",
    address: formData.address || "",
    businessAddress: formData.businessAddress || "",
    city: formData.city || "",
    province: formData.businessProvince || formData.province || "",
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
      province: addressData.province || prev.province || "",
      businessProvince: addressData.province || prev.businessProvince || "",
      state: addressData.province || prev.state || "",
      postalCode: addressData.postalCode || prev.postalCode || "",
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
              <p className="col-span-2 text-sm text-black/55">
                No service categories available yet.
              </p>
            )}
          </div>
          {touched.serviceTypeId && errors.serviceTypeId && (
            <p className="text-red-500 text-xs mb-3">{errors.serviceTypeId}</p>
          )}

          <div className="grid gap-4">
            <InputWithLabel
              labelName="Business name"
              inputType="text"
              placeholder="The continental"
              inputName="businessName"
              inputValue={values.businessName}
              inputOnChange={handleChange}
              inputOnBlur={handleBlur}
              inputError={touched.businessName && errors.businessName ? errors.businessName : ""}
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
                Clients travel here when they book a visit, so enter the place they should
                come to, not a mailing address. It shows on your public profile with a
                directions link and again in their booking confirmation. We cannot approve
                your account or show you in search until we have it.
              </p>
              {touched.address && errors.address && (
                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
              )}
            </div>

            {/* Always visible so a free-typed address can be completed
                manually when Places suggestions are unavailable. */}
            <div className="grid grid-cols-3 gap-3 mt-1">
              <InputWithLabel
                labelName="City"
                inputType="text"
                inputName="city"
                inputValue={values.city}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={touched.city && errors.city ? errors.city : ""}
              />
              <InputWithLabel
                labelName="Province"
                inputType="text"
                inputName="province"
                inputValue={values.province}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={touched.province && errors.province ? errors.province : ""}
              />
              <InputWithLabel
                labelName="Postal code"
                inputType="text"
                inputName="postalCode"
                inputValue={values.postalCode}
                inputOnChange={handleChange}
                inputOnBlur={handleBlur}
                inputError={touched.postalCode && errors.postalCode ? errors.postalCode : ""}
              />
            </div>
          </div>

          {/* Pricing & payout basics — shown during onboarding so pros know the
              economics before they finish signing up. */}
          <div className="mt-8">
            <GoodToKnow variant="styler" />
          </div>

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
