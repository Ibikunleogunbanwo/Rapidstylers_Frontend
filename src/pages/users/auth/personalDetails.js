import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import sideImage from "../../../assets/images/signup.jpg";
import InputWithLabel from "../../../components/inputWithLabel";
import SelectInput from "../../../components/selectInput";
import Buttons from "../../../components/button";
import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup"; 

const PersonalDetails = () => {
  useEffect(() => {
    document.title = "Personal Details | Rapid Stylers";
    document.querySelector('meta[name="description"]').content = "Complete the form to create your personalized profile.";
}, []);

  const location  = useLocation();
  const navigate = useNavigate();
  const emailAddress = location.state?.userEmailAddress || '';
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
    },
    validationSchema : Yup.object({
      firstname : Yup.string().required("Firstname cannot be empty").min(3,"Firstname must be at least 3 letters"),
      lastname : Yup.string().required("Lastname cannot be empty").min(3,"Lastname must be at least 3 letters"),
      country : Yup.string().required("Kindly select a country"),
      address : Yup.string().required("Address cannot be empty").min(3,"Address must be at least 3 letters"),
      state : Yup.string().required("Kindly select a state"), 
      phoneNumber : Yup.string().required("Phone Number cannot be empty").typeError('Invalid Phone Number Format').matches(/^[\d+\s()-]+$/, 'Phone Number must be a number')
    }),
    onSubmit: (values) => {
      const {firstname, lastname, country, address, state, phoneNumber} = values;
      let userProfileData = {firstname,lastname, country, address, state, phoneNumber,emailAddress};
      sessionStorage.setItem('userProfileData', JSON.stringify(userProfileData));
      navigate("/secureAccount")
    }
  })
  return (
    <div className="lg:h-screen grid grid-cols-1 lg:grid-cols-12">
      <div className="m-1 rounded-md overflow-hidden col-span-1 lg:col-span-3">
        <div className="relative h-52 lg:h-full">
          <img src={sideImage} alt="" className="w-full object-cover h-full" />
          <div className="absolute top-0 w-full h-full bg-black/90 text-white px-6 py-4 flex items-center">
            <div className="grid gap-6">
              <div className="lg:flex items-center gap-4 hidden">
                <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">1</div>
                <div className="text-2xl lg:text-sm">Register email address</div>
              </div>
              <div className="lg:flex items-center gap-1 lg:gap-4 hidden">
                <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">2</div>
                <div className="text-2xl lg:text-sm">Verify email address</div>
              </div>

              <div className="grid lg:flex items-center gap-1 lg:gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-white text-white hidden lg:flex items-center justify-center text-xs font-bold">3</div>
                <div className="opacity-40 flex lg:hidden">Step 3 0f 4</div>
                <div className="text-2xl lg:text-sm">Personal details</div>
              </div>
              <div className="lg:flex items-center gap-4 opacity-40 hidden">
                <div className="h-8 w-8 rounded-full border-2 border-white text-white  flex items-center justify-center text-xs font-bold">4</div>
                <div className="text-2xl lg:text-sm">Secure your account</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-1 lg:col-span-9 p-6">
        <div className="py-6 w-full">
          <img src={logo} alt="" className="h-10 mb-6" />
          <p className="text-xl">Personal details.</p>
          <p className="text-black/60">
            Please provide details about yourself.
          </p>
          <form onSubmit={personalData.handleSubmit}>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
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
                            inputName={"address"}
                            inputOnBlur={personalData.handleBlur}
                            inputOnChange={personalData.handleChange}
                            inputValue={personalData.values.address}
                            inputError={personalData.touched.address && personalData.errors.address ? personalData.errors.address : null} />
            <InputWithLabel labelName={"Phone Number"} 
                            inputType={"text"} 
                            inputName={"phoneNumber"} 
                            inputOnBlur={personalData.handleBlur}
                            inputOnChange={personalData.handleChange}
                            inputValue={personalData.values.phoneNumber}
                            inputError={personalData.touched.phoneNumber && personalData.errors.phoneNumber ? personalData.errors.phoneNumber : null} />
          </div>
          <div className="mt-8">
              <Buttons btnText={'Continue'} btnType={'primary'} type={"submit"}/>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
