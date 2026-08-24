import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import OtpInputs from "../../../components/otpInputs";
import { clearOTP, handleInput } from "../../../utils/utility";
import { useFormik } from "formik";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Buttons from "../../../components/button";
import { verifyOtpCode } from "../../../hooks/local/userReducer";
import Spinner from "../../../components/spinner";

const steps = [
  "Register email address",
  "Verify email address",
  "Personal details",
  "Secure your account",
];

const VerifyUserEmailAddress = () => {
  useEffect(() => {
    document.title = "Verify Email Address | RapidStylers";
    document.querySelector('meta[name="description"]').content = "Verify Email Address to validate your account for your beautification";
}, []);

const location  = useLocation();
const navigate = useNavigate();
const dispatch = useDispatch();

const userEmailAddress = location.state?.emailAddress || sessionStorage.getItem('signupEmail') || '';

  const handleOTPCodeChange = (currentInput)=>{
    const userInput = handleInput(currentInput);
    verifyUserEmail.setFieldValue('otpCode', userInput);
  }
  const clearUserOTP = () => {
    clearOTP();
    document.getElementById('userInput').value = "";
}
  const verifyUserEmail = useFormik({
    initialValues: {
      otpCode: "",
    },
    onSubmit: async (values) => {
      const {otpCode} = values
      const {payload} = await dispatch(verifyOtpCode(otpCode));
      if(payload.statusCode === "200") {
        // Use the email from the backend response (source of truth) and persist
        // it so a refresh on the next step keeps the flow working.
        const verifiedEmail = payload.data?.emailAddress || userEmailAddress;
        sessionStorage.setItem('signupEmail', verifiedEmail);
        navigate("/personalDetails", {state : {userEmailAddress: verifiedEmail}});
      }
    },
  })
  return (
    <React.Fragment>
       <Spinner loading={useSelector((state)=>state.user).loading}/>
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
                <div key={step} className={`flex items-center gap-3 ${i + 1 === 2 ? "" : "opacity-50"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= 2 ? "bg-brand text-white" : "border-2 border-white text-white"}`}>
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
            <p className="text-2xl font-bold text-gray-900">Verify your email address.</p>
            <p className="text-black/60 text-sm mt-1">
              A verification code was sent to your email address ({userEmailAddress}).
              Please provide the code and click on verify.
            </p>
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-primary/50 cursor-pointer" onClick={clearUserOTP}>Clear code</p>
            </div>
            <div className="w-full grid grid-cols-6 md:grid-cols-10 gap-4 mt-8">
              <OtpInputs id={'digit1'} onChange={handleOTPCodeChange}/>
              <OtpInputs id={'digit2'} onChange={handleOTPCodeChange}/>
              <OtpInputs id={'digit3'} onChange={handleOTPCodeChange}/>
              <OtpInputs id={'digit4'} onChange={handleOTPCodeChange}/>
              <OtpInputs id={'digit5'} onChange={handleOTPCodeChange}/>
              <OtpInputs id={'digit6'} onChange={handleOTPCodeChange}/>
            </div>
            <div className="mt-6">
              <form onSubmit={verifyUserEmail.handleSubmit}>
                <input name="otpCode" type="text" id="userInput" hidden  value={verifyUserEmail.values.otpCode} onChange={verifyUserEmail.handleChange} onBlur={verifyUserEmail.handleBlur} />
                <Buttons btnType={"primary"} type={"submit"} btnText={"Verify"} />
              </form>
            </div>
          </div>
          <div className="bg-stylerDoodle h-32 w-full lg:hidden"></div>
        </div>
      </div>
    </div>
    </React.Fragment>
  );
};

export default VerifyUserEmailAddress;
