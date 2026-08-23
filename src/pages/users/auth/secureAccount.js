import logo from "../../../assets/svg-icons/colouredLogo.svg";
import Buttons from "../../../components/button";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import Lottie from "lottie-react";
import successAnim from "../../../assets/svg-icons/successAnim.json";
import * as Yup from "yup";
import PasswordInput from "../../../components/passwordInput";
import { useDispatch } from "react-redux";
import { createUserAccount, getUserDetails, userAuthenticate } from "../../../hooks/local/userReducer";
import { useNavigate } from "react-router-dom";

const steps = [
  "Register email address",
  "Verify email address",
  "Personal details",
  "Secure your account",
];

const SecureAccount = () => {
  useEffect(() => {
    document.title = "Secure Account | RapidStylers";
    document.querySelector('meta[name="description"]').content = "Join RapidStylers: Start your beautification journey with a personalized account.";
  }, []);

  const userProfileData = JSON.parse(sessionStorage.getItem('userProfileData'));
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dashboardModal, setDashboardModal] = useState(false);
  const [userEmailAddress, setUserEmailAddress] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const createAccountForm = useFormik(
    {
      initialValues: {
        password: "",
        confirmPassword: "",
      },
      validationSchema: Yup.object({
        password: Yup.string().required("Password is required")
          .min(8, "Password must be at least 8 characters")
          .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
          .matches(/[a-z]/, "Password must contain at least one lowercase letter")
          .matches(/[0-9]/, "Password must contain at least one digit")
          .matches(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
        confirmPassword: Yup.string()
          .required('Confirm Password is required')
          .oneOf([Yup.ref('password'), null], 'Passwords must match'),
      }),
      onSubmit: async (values) => {
        const { password } = values;
        const { firstname, lastname, country, address, state, phoneNumber, emailAddress } = userProfileData;
        let userRegistrationData = { firstname, lastname, country, address, state, emailAddress, phoneNumber, password };
        const { payload } = await dispatch(createUserAccount(userRegistrationData));
        if(payload.statusCode === "200"){
          setDashboardModal(true);
          setUserEmailAddress(emailAddress);
          setUserPassword(password);
        }
      }
    }
  )
  const proceedToDashboard = async() => {
      let userSignInData = {emailAddress: userEmailAddress, password: userPassword}
      const { payload} = await dispatch(userAuthenticate(userSignInData));
      if(payload.statusCode === "200"){
        dispatch(getUserDetails(payload.data.userId));
        setDashboardModal(false);
        navigate("/dashboard")
      }
  }
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
                <div key={step} className={`flex items-center gap-3 ${i + 1 === 4 ? "" : "opacity-50"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= 4 ? "bg-brand text-white" : "border-2 border-white text-white"}`}>
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
            <p className="text-2xl font-bold text-gray-900">Secure your account.</p>
            <p className="text-black/60 text-sm mt-1">
              Create a password with at least <span className="text-black">8 characters, 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character.</span>
            </p>
            <form onSubmit={createAccountForm.handleSubmit} className="mt-6 grid gap-4">
              <PasswordInput labelName={"Password"}
                inputType={"password"}
                inputName={"password"}
                inputOnBlur={createAccountForm.handleBlur}
                inputOnChange={createAccountForm.handleChange}
                inputValue={createAccountForm.values.password}
                inputError={createAccountForm.touched.password && createAccountForm.errors.password ? createAccountForm.errors.password : null} />
              <PasswordInput labelName={"Confirm Password"}
                inputType={"password"}
                inputName={"confirmPassword"}
                inputOnBlur={createAccountForm.handleBlur}
                inputOnChange={createAccountForm.handleChange}
                inputValue={createAccountForm.values.confirmPassword}
                inputError={createAccountForm.touched.confirmPassword && createAccountForm.errors.confirmPassword ? createAccountForm.errors.confirmPassword : null} />
              <Buttons btnText={"Create Account"} btnType={"primary"} type={"submit"} />
            </form>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
      {dashboardModal && (

      <div className="fixed bg-black/60 h-screen w-full px-4 flex items-center justify-center z-50">
      <div className="bg-white rounded-md w-full md:w-[35%] flex flex-col items-center justify-center">
        <div className="">
          <Lottie animationData={successAnim} className="h-48"/>
        </div>
      <p className="-mt-8 text-center px-4">Account created successfully. Proceed to your dashboard.</p>
        <div className="px-6 py-8 grid gap-4">
          <Buttons btnText={"Go to Dashboard"} btnType={"primary"} type={"button"} onClick={()=>proceedToDashboard()}  />
        </div>
      </div>
    </div>
      )}


    </div>


  );
};

export default SecureAccount;
