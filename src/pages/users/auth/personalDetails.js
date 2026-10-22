import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import InputWithLabel from "../../../components/inputWithLabel";
import SelectInput from "../../../components/selectInput";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import Button from "../../../components/button";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { CustomerSignupCounter, CustomerSignupRail } from "./customerSignupRail";
import ProvinceSelect from "../../../components/provinceSelect";
import { getSignupToken } from "./signupSession";
import {
  CITY_MAX,
  NAME_MAX,
  PHONE_EXAMPLE,
  cityError,
  cleanName,
  formatCanadianPhone,
  formatPostalCode,
  nameError,
  phoneDigits,
  phoneError,
  postalCodeError,
  provinceError,
  toProvinceName,
} from "../../../utils/signupValidation";

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

/** A Yup test from one of the shared sign-up rules (which return "" when fine). */
const rule = (check) => function (value) {
  const message = check(value);
  return message ? this.createError({ message }) : true;
};

const PersonalDetails = () => {
  useEffect(() => {
    document.title = "Personal Details | RapidStylers";
    // Optional chaining: never crash the page if the meta tag is missing.
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", "Complete the form to create your personalized profile.");
}, []);

  const location  = useLocation();
  const navigate = useNavigate();
  const signupToken = getSignupToken(location.state);
  const legacyEmail = signupToken ? undefined : location.state?.emailAddress;
  const country = [{ value: 'Canada', label: 'Canada' }]
  const personalData = useFormik({
    initialValues: {
      firstname: '',
      lastname: '',
      country: 'Canada',
      street: '',
      unit: '',
      city: '',
      province: '',
      postalCode: '',
      phoneNumber: '',
      agreeToTerms: false,
    },
    validationSchema : Yup.object({
      // The shared sign-up rules, which the backend applies to the same fields.
      firstname : Yup.string().test("name", rule((v) => nameError(v, "first name"))),
      lastname : Yup.string().test("name", rule((v) => nameError(v, "last name"))),
      country : Yup.string().required("Kindly select a country"),
      street : Yup.string().required("Street address is required").min(3,"Street address must be at least 3 letters"),
      city : Yup.string().test("city", rule((v) => cityError(v))),
      province : Yup.string().test("province", rule((v) => provinceError(v))),
      postalCode : Yup.string().test("postal", rule((v) => postalCodeError(v))),
      agreeToTerms : Yup.boolean().oneOf([true], "You must agree to the Terms and Conditions"),
      phoneNumber : Yup.string().test("ca-phone", rule((v) => phoneError(v)))
    }),
    onSubmit: (values) => {
      const {country, phoneNumber} = values;
      // Names and city go out trimmed, the postal code as "T2P 1B5".
      const firstname = cleanName(values.firstname);
      const lastname = cleanName(values.lastname);
      values = { ...values, city: values.city.trim(), postalCode: formatPostalCode(values.postalCode) };
      // Persist the single-line address in Canadian convention — the backend
      // stores address + state (province) + country for user accounts.
      const address = composeCanadianAddress(values);
      let userProfileData = {firstname,lastname, country, address, state: values.province, phoneNumber: phoneDigits(phoneNumber), signupToken, ...(legacyEmail ? { emailAddress: legacyEmail } : {}), agreeToTerms: values.agreeToTerms};
      sessionStorage.setItem('userProfileData', JSON.stringify(userProfileData));
      navigate("/secureAccount")
    }
  })
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left panel */}
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block relative lg:sticky lg:top-0">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white px-10">
          <div className="max-w-sm grid gap-8">
            <p className="text-[clamp(1.75rem,3vw,2.5rem)] font-normal leading-[1.15] tracking-[-0.02em]">
              Create your <span className="text-brand">RapidStylers</span> account
            </p>
            <CustomerSignupRail />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full">
            <Link to="/" aria-label="RapidStylers home" className="inline-block mb-8"><img src={logo} alt="" className="h-10" /></Link>
            <CustomerSignupCounter />
            <h1 className="mt-2 text-[22px] font-normal tracking-[-0.01em] text-onSurface">Personal details</h1>
            <p className="text-black/60 text-sm mt-1">
              Please provide details about yourself.
            </p>
            <form onSubmit={personalData.handleSubmit} className="mt-6 grid gap-4">
              <InputWithLabel labelName={"First name"}
                              inputType={"text"}
                              placeholder={"e.g. Jordan"}
                              inputName={"firstname"}
                              autoComplete="given-name"
                              maxLength={NAME_MAX}
                              required
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.firstname}
                              inputError={personalData.touched.firstname && personalData.errors.firstname ? personalData.errors.firstname : null} />
              <InputWithLabel labelName={"Last name"}
                              inputType={"text"}
                              placeholder={"e.g. Lee"}
                              inputName={"lastname"}
                              autoComplete="family-name"
                              maxLength={NAME_MAX}
                              required
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.lastname}
                              inputError={personalData.touched.lastname && personalData.errors.lastname ? personalData.errors.lastname : null} />
              <SelectInput labelName={"Country"}
                           selectOptions={country}
                           valueKey={'value'}
                           labelKey={'label'}
                           selectName={"country"}
                           selectBlur={personalData.handleBlur}
                           onChange={(event)=>personalData.setFieldValue('country',event.target.value)}
                           selectValue={personalData.values.country}
                           selectError={personalData.touched.country && personalData.errors.country ? personalData.errors.country : null} />

              {/* Google Places search — auto-computes every Canadian field below */}
              <AddressAutocomplete
                label="Find your address:"
                value={personalData.values.street}
                placeholder={"Start typing your address…"}
                onChange={(data) => {
                  // Free-text edits carry only the raw line — update the street without
                  // wiping the computed Canadian fields. A real Places selection carries
                  // parsed components, so it recomputes everything.
                  const isSelection = !!(data.city || data.province || data.postalCode);
                  personalData.setFieldValue("street", data.streetAddress || data.formattedAddress || "");
                  if (isSelection) {
                    personalData.setFieldValue("unit", data.unit || "");
                    personalData.setFieldValue("city", data.city || "");
                    personalData.setFieldValue("province", toProvinceName(data.province));
                    personalData.setFieldValue("postalCode", formatPostalCode(data.postalCode));
                    personalData.setFieldValue("country", data.country || "Canada");
                    ["street", "city", "province", "postalCode", "country"].forEach((f) =>
                      personalData.setFieldTouched(f, true, false)
                    );
                  }
                }}
              />

              <InputWithLabel labelName={"Street address"}
                              inputType={"text"}
                              placeholder={"e.g. 123 Main Street"}
                              inputName={"street"}
                              autoComplete="address-line1"
                              required
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.street}
                              inputError={personalData.touched.street && personalData.errors.street ? personalData.errors.street : null} />
              <InputWithLabel labelName={"Unit / Apt / Suite"}
                              inputType={"text"}
                              placeholder={"Optional"}
                              inputName={"unit"}
                              autoComplete="address-line2"
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.unit}
                              inputError={personalData.touched.unit && personalData.errors.unit ? personalData.errors.unit : null} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputWithLabel labelName={"City"}
                                inputType={"text"}
                                placeholder={"e.g. Toronto"}
                                inputName={"city"}
                                autoComplete="address-level2"
                                maxLength={CITY_MAX}
                                required
                                inputOnBlur={personalData.handleBlur}
                                inputOnChange={personalData.handleChange}
                                inputValue={personalData.values.city}
                                inputError={personalData.touched.city && personalData.errors.city ? personalData.errors.city : null} />
                <ProvinceSelect value={personalData.values.province}
                                onChange={personalData.handleChange}
                                onBlur={personalData.handleBlur}
                                required
                                error={personalData.touched.province && personalData.errors.province ? personalData.errors.province : ""} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputWithLabel labelName={"Postal code"}
                                inputType={"text"}
                                placeholder={"e.g. M5V 2T6"}
                                inputName={"postalCode"}
                                autoComplete="postal-code"
                                maxLength={7}
                                required
                                inputOnBlur={(e) => { personalData.setFieldValue("postalCode", formatPostalCode(e.target.value)); personalData.handleBlur(e); }}
                                inputOnChange={personalData.handleChange}
                                inputValue={personalData.values.postalCode}
                                inputError={personalData.touched.postalCode && personalData.errors.postalCode ? personalData.errors.postalCode : null} />
                <InputWithLabel labelName={"Phone number"}
                                inputType={"tel"}
                                placeholder={PHONE_EXAMPLE}
                                inputName={"phoneNumber"}
                                autoComplete="tel-national"
                                inputMode="tel"
                                required
                                inputOnBlur={personalData.handleBlur}
                                inputOnChange={(e) => personalData.setFieldValue("phoneNumber", formatCanadianPhone(e.target.value))}
                                inputValue={personalData.values.phoneNumber}
                                inputError={personalData.touched.phoneNumber && personalData.errors.phoneNumber ? personalData.errors.phoneNumber : null} />
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={personalData.values.agreeToTerms}
                  onChange={personalData.handleChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link to="/terms-and-conditions" target="_blank" className="text-brand font-semibold hover:underline">
                    Terms and Conditions
                  </Link>
                  {' '}and have read the{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-brand font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {personalData.touched.agreeToTerms && personalData.errors.agreeToTerms && (
                <p className="text-xs text-red-500 -mt-2">{personalData.errors.agreeToTerms}</p>
              )}
              <Button text={'Continue'} variant={'primary'} type={"submit"} />
            </form>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
