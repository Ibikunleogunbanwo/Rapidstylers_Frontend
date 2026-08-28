import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import InputWithLabel from "../../../components/inputWithLabel";
import SelectInput from "../../../components/selectInput";
import AddressAutocomplete from "../../../components/AddressAutocomplete";
import Buttons from "../../../components/button";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

const steps = [
  "Register email address",
  "Verify email address",
  "Personal details",
  "Secure your account",
];

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

/** Format a 10/11-digit Canadian number as (XXX) XXX-XXXX while typing. */
const formatCanadianPhone = (value) => {
  const digits = (value || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "").slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const phoneDigits = (value) => (value || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");

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
  const emailAddress = location.state?.userEmailAddress || sessionStorage.getItem('signupEmail') || '';
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
      firstname : Yup.string().required("Firstname cannot be empty").min(3,"Firstname must be at least 3 letters"),
      lastname : Yup.string().required("Lastname cannot be empty").min(3,"Lastname must be at least 3 letters"),
      country : Yup.string().required("Kindly select a country"),
      street : Yup.string().required("Street address is required").min(3,"Street address must be at least 3 letters"),
      city : Yup.string().required("City is required"),
      province : Yup.string().required("Province is required"),
      postalCode : Yup.string()
        .required("Postal code is required")
        .matches(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Enter a valid Canadian postal code (e.g. T2P 1B5)"),
      agreeToTerms : Yup.boolean().oneOf([true], "You must agree to the Terms and Conditions"),
      phoneNumber : Yup.string()
        .required("Phone number is required")
        .test("ca-phone", "Enter a valid Canadian phone number, e.g. (587) 555-1234", (val) => {
          if (!val) return false;
          const digits = phoneDigits(val);
          return digits.length === 10;
        })
    }),
    onSubmit: (values) => {
      const {firstname, lastname, country, phoneNumber} = values;
      // Persist the single-line address in Canadian convention — the backend
      // stores address + state (province) + country for user accounts.
      const address = composeCanadianAddress(values);
      let userProfileData = {firstname,lastname, country, address, state: values.province, phoneNumber: phoneDigits(phoneNumber), emailAddress, agreeToTerms: values.agreeToTerms};
      sessionStorage.setItem('userProfileData', JSON.stringify(userProfileData));
      navigate("/secureAccount")
    }
  })
  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left panel */}
      <div className="col-span-1 lg:col-span-8 h-screen overflow-hidden hidden lg:block relative">
        <div className="bg-stylerDoodle h-full w-full bg-repeat bg-auto"></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 flex items-center justify-center text-white px-10">
          <div className="max-w-sm grid gap-8">
            <p className="text-3xl font-bold font-serif leading-tight">
              Create your <span className="text-brand">RapidStylers</span> account
            </p>
            <div className="grid gap-4">
              {steps.map((step, i) => (
                <div key={step} className={`flex items-center gap-3 ${i + 1 === 3 ? "" : "opacity-50"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= 3 ? "bg-brand text-white" : "border-2 border-white text-white"}`}>
                    {i + 1}
                  </div>
                  <div className="text-sm">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="col-span-1 lg:col-span-4">
        <div className="grid content-between h-full">
          <div className="p-5 md:p-10 mb-6 md:mb-0 w-full">
            <img src={logo} alt="" className="h-10 mb-8" />
            <p className="text-2xl font-bold text-gray-900">Personal details.</p>
            <p className="text-black/60 text-sm mt-1">
              Please provide details about yourself.
            </p>
            <form onSubmit={personalData.handleSubmit} className="mt-6 grid gap-4">
              <InputWithLabel labelName={"First name"}
                              inputType={"text"}
                              placeholder={"e.g John"}
                              inputName={"firstname"}
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.firstname}
                              inputError={personalData.touched.firstname && personalData.errors.firstname ? personalData.errors.firstname : null} />
              <InputWithLabel labelName={"Last name"}
                              inputType={"text"}
                              placeholder={"e.g Doe"}
                              inputName={"lastname"}
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
                    personalData.setFieldValue("province", data.province || "");
                    personalData.setFieldValue("postalCode", (data.postalCode || "").toUpperCase());
                    personalData.setFieldValue("country", data.country || "Canada");
                    ["street", "city", "province", "postalCode", "country"].forEach((f) =>
                      personalData.setFieldTouched(f, true, false)
                    );
                  }
                }}
              />

              <InputWithLabel labelName={"Street address"}
                              inputType={"text"}
                              placeholder={"e.g 123 Main Street"}
                              inputName={"street"}
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.street}
                              inputError={personalData.touched.street && personalData.errors.street ? personalData.errors.street : null} />
              <InputWithLabel labelName={"Unit / Apt / Suite"}
                              inputType={"text"}
                              placeholder={"Optional"}
                              inputName={"unit"}
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.unit}
                              inputError={personalData.touched.unit && personalData.errors.unit ? personalData.errors.unit : null} />
              <div className="grid grid-cols-2 gap-3">
                <InputWithLabel labelName={"City"}
                                inputType={"text"}
                                placeholder={"e.g Toronto"}
                                inputName={"city"}
                                inputOnBlur={personalData.handleBlur}
                                inputOnChange={personalData.handleChange}
                                inputValue={personalData.values.city}
                                inputError={personalData.touched.city && personalData.errors.city ? personalData.errors.city : null} />
                <InputWithLabel labelName={"Province"}
                                inputType={"text"}
                                placeholder={"e.g Ontario"}
                                inputName={"province"}
                                inputOnBlur={personalData.handleBlur}
                                inputOnChange={personalData.handleChange}
                                inputValue={personalData.values.province}
                                inputError={personalData.touched.province && personalData.errors.province ? personalData.errors.province : null} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputWithLabel labelName={"Postal code"}
                                inputType={"text"}
                                placeholder={"e.g M5V 2T6"}
                                inputName={"postalCode"}
                                inputOnBlur={personalData.handleBlur}
                                inputOnChange={personalData.handleChange}
                                inputValue={personalData.values.postalCode}
                                inputError={personalData.touched.postalCode && personalData.errors.postalCode ? personalData.errors.postalCode : null} />
                <InputWithLabel labelName={"Phone Number"}
                                inputType={"tel"}
                                placeholder={"(587) 555-1234"}
                                inputName={"phoneNumber"}
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
                </span>
              </label>
              {personalData.touched.agreeToTerms && personalData.errors.agreeToTerms && (
                <p className="text-xs text-red-500 -mt-2">{personalData.errors.agreeToTerms}</p>
              )}
              <Buttons btnText={'Continue'} btnType={'primary'} type={"submit"} />
            </form>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
