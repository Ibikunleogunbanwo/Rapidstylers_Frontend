import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import InputWithLabel from "../../../components/inputWithLabel";
import SelectInput from "../../../components/selectInput";
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

const PersonalDetails = () => {
  useEffect(() => {
    document.title = "Personal Details | RapidStylers";
    document.querySelector('meta[name="description"]').content = "Complete the form to create your personalized profile.";
}, []);

  const location  = useLocation();
  const navigate = useNavigate();
  const emailAddress = location.state?.userEmailAddress || sessionStorage.getItem('signupEmail') || '';
  const country = [{ value: 'Canada', label: 'Canada' }]
  const province = [
    { value: 'Alberta', label: 'Alberta' },
    { value: 'British Columbia', label: 'British Columbia' },
    { value: 'Manitoba', label: 'Manitoba' },
    { value: 'New Brunswick', label: 'New Brunswick' },
    { value: 'Newfoundland and Labrador', label: 'Newfoundland and Labrador' },
    { value: 'Nova Scotia', label: 'Nova Scotia' },
    { value: 'Ontario', label: 'Ontario' },
    { value: 'Prince Edward Island', label: 'Prince Edward Island' },
    { value: 'Quebec', label: 'Quebec' },
    { value: 'Saskatchewan', label: 'Saskatchewan' }
  ];
  const personalData = useFormik({
    initialValues: {
      firstname: '',
      lastname: '',
      country: '',
      address: '',
      state: '',
      phoneNumber: '',
      agreeToTerms: false,
    },
    validationSchema : Yup.object({
      firstname : Yup.string().required("Firstname cannot be empty").min(3,"Firstname must be at least 3 letters"),
      lastname : Yup.string().required("Lastname cannot be empty").min(3,"Lastname must be at least 3 letters"),
      country : Yup.string().required("Kindly select a country"),
      address : Yup.string().required("Address cannot be empty").min(3,"Address must be at least 3 letters"),
      state : Yup.string().required("Kindly select a state"),
      agreeToTerms : Yup.boolean().oneOf([true], "You must agree to the Terms and Conditions"),
      phoneNumber : Yup.string()
        .required("Phone number is required")
        .matches(/^[0-9]+$/, "Phone number can only contain digits")
        .test("ca-phone", "Enter a valid Canadian phone number (10 digits, or 11 with leading 1)", (val) => {
          if (!val) return false;
          return val.length === 10 || (val.length === 11 && val.startsWith("1"));
        })
    }),
    onSubmit: (values) => {
      const {firstname, lastname, country, address, state, phoneNumber} = values;
      let userProfileData = {firstname,lastname, country, address, state, phoneNumber,emailAddress};
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
              <SelectInput labelName={"State / Province"}
                           selectOptions={province}
                           valueKey={'value'}
                           labelKey={'label'}
                           selectName={"state"}
                           selectBlur={personalData.handleBlur}
                           onChange={(event)=>personalData.setFieldValue('state',event.target.value)}
                           selectValue={personalData.values.state}
                           selectError={personalData.touched.state && personalData.errors.state ? personalData.errors.state : null} />
              <InputWithLabel labelName={"Physical Address"}
                              inputType={"text"}
                              placeholder={"e.g 123 Main Street"}
                              inputName={"address"}
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.address}
                              inputError={personalData.touched.address && personalData.errors.address ? personalData.errors.address : null} />
              <InputWithLabel labelName={"Phone Number"}
                              inputType={"text"}
                              placeholder={"e.g. 5875551234"}
                              inputName={"phoneNumber"}
                              inputOnBlur={personalData.handleBlur}
                              inputOnChange={personalData.handleChange}
                              inputValue={personalData.values.phoneNumber}
                              inputError={personalData.touched.phoneNumber && personalData.errors.phoneNumber ? personalData.errors.phoneNumber : null} />
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
