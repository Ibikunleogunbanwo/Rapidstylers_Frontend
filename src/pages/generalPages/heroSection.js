
import logo from "../../assets/svg-icons/logo.svg";
import React, { useState } from "react";
import info from "../../assets/svg-icons/info.svg";
import { Link, useNavigate } from "react-router-dom";
import Buttons from "../../components/button";
import InputWithLabel from "../../components/inputWithLabel";
import Modal from "../../components/modals";
import { useFormik } from "formik";
import * as Yup from "yup";
import Spinner from "../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails, userAuthenticate, verifySignUpEmailAddress } from "../../hooks/local/userReducer";
import PasswordInput from "../../components/passwordInput";
import SearchForStyler from "../../components/searchForStyler";
import elevate from "../../assets/images/elevate.png"
import { showSuccessToastMessage } from "../../utils/constant";
import { getPeriodOfDay } from "../../utils/utility";

const Hero = ({ height }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userError = useSelector((state) => state.user?.error);

  const [signInVisible, setSignInVisible] = useState(false);
  const [signUpVisible, setSignUpVisible] = useState(false);

  const toggleSignIn = () => {
    setSignInVisible(!signInVisible);
    setSignUpVisible(false);
  };

  const toggleSignUp = () => {
    setSignUpVisible(!signUpVisible);
    setSignInVisible(false);
  };
  const periodOfTheDay = getPeriodOfDay();
  const userSignUp = useFormik({
    initialValues: {
      emailAddress: ""
    },
    validationSchema: Yup.object({
      emailAddress: Yup.string().required("Email is required").email("Invalid Email Address")
    }),
    onSubmit: async (values) => {
      const { emailAddress } = values;
      let verifyUserEmailData = { emailAddress };
      const { payload } = await dispatch(verifySignUpEmailAddress(verifyUserEmailData));
      if (payload.statusCode === "200") {
        // Persist the signup email so a refresh mid-flow doesn't lose it.
        sessionStorage.setItem("signupEmail", emailAddress);
        navigate("/verifyEmailAddress", { state: { emailAddress } });
      }
    }
  });

  const userSignIn = useFormik({
    initialValues: {
      emailAddress: "",
      password: ""
    },
    validationSchema: Yup.object({
      emailAddress: Yup.string().email("Invalid Email Address").required("Email is required"),
      password: Yup.string().required("Password cannot be empty"),
    }),
    onSubmit: async (values) => {
      const { emailAddress, password } = values;
      let authData = { emailAddress, password };
      const { payload } = await dispatch(userAuthenticate(authData))
      if (payload.statusCode === "200") {
        showSuccessToastMessage(`Good ${periodOfTheDay} `+payload.data.firstname);
        dispatch(getUserDetails(payload.data.userId));
        navigate('/dashboard');
      }
    }
  })
  return (
    <div style={{ height }} className="relative z-10">
      <Spinner loading={useSelector((state) => state.user).loading} />

      <div className="h-[100%] absolute w-full flex items-center overflow-hidden">
        <div className="w-full h-full relative">
          {/* Landing */}
          <div className={`absolute w-full h-full flex top-0 items-center justify-center px-4 pt-[60px] sm:pt-[80px] bg-black ${document.title === "Welcome - RapidStylers" ? "block" : "hidden"}`}>
            <div className="w-full md:w-[50%] lg:w-[40%]">
                <div className="text-[22px] sm:text-xl md:text-2xl lg:text-[28px] font-bold text-white justify-self-center text-center mb-2 leading-snug">
                  Get convenient,<span className="text-brand"> high-quality beauty services </span>without leaving your home.
                </div>
              <p className="text-white/70 text-xs sm:text-sm md:text-base text-center justify-self-center max-w-md mx-auto">Our platform connects you with top-rated local beauty professionals for in-home appointments.</p>
              <SearchForStyler />
            </div>
          </div>

          {/* About */}
          <div className={`relative w-full h-full ${document.title === "About us | RapidStylers" ? "block" : "hidden"}`}>
            <div className="h-full w-full bg-black relative flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(147,129,255,0.4),transparent_55%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,129,255,0.2),transparent_50%)]"></div>
              <div className="relative text-white text-center px-4 sm:px-6 pt-[60px] sm:pt-[80px] max-w-3xl">
                <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-brand font-bold">About RapidStylers</p>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mt-4 leading-tight font-serif">
                  Say goodbye to the <span className="text-brand">salon struggle.</span>
                </h1>
                <p className="mt-5 text-white/75 text-sm md:text-lg leading-relaxed">
                  The clock races by, your schedule is packed, and booking the
                  appointment you need keeps slipping out of reach. RapidStylers
                  makes it simple.
                </p>
              </div>
            </div>
          </div>

          {/* Elevate your looks */}
          <div className={`relative ${document.title === "Elevate your looks | RapidStylers" ? "block" : "hidden"}`}>
            <img src={elevate} alt=""  className="h-[75vh] object-cover"/>
            <div className="h-full w-full flex items-center justify-center absolute top-0 pt-[80px] text-white text-center px-10">
              <div>
                <p className="text-2xl md:text-3xl font-medium mb-3">Elevate your style</p>
                <p>Explore our exclusive collection of trendsetting styles for men and women</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div className="fixed w-full flex items-center border-b border-[#ffffff16] bg-[#00000060] backdrop-blur-xl px-3 sm:px-4 md:px-[50px] text-white py-3 sm:py-4 md:py-5 z-20">
        <div className="w-full flex justify-between items-center">
          <Link to={"/"} onClick={(e) => { e.preventDefault(); window.location.href = "/"; }}>
            <img src={logo} alt="RapidStylers" className="h-8 sm:h-10" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
            <div className="flex items-center gap-2 sm:gap-3 md:divide-x md:text-sm text-[11px] sm:text-xs">
              <span className="md:pe-3 cursor-pointer hover:text-white/80 transition" onClick={toggleSignIn}>
                Login
              </span>
              <span className="px-2 sm:px-3 md:ps-3 cursor-pointer hover:text-white/80 transition" onClick={toggleSignUp}>
                Sign up
              </span>
              <span className="hidden sm:inline md:ps-3 cursor-pointer hover:text-white/80 transition" onClick={() => navigate('/styler-signup')}>
                For pros
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sign in modal */}
      <Modal
        modalTitle={"Login"}
        isVisible={signInVisible}
        onClose={() => setSignInVisible(false)}
        width={"md:w-[40%] lg:w-[35%]"}
      >
        <form onSubmit={userSignIn.handleSubmit}>
          <div className="flex gap-3 flex-col">
            <InputWithLabel
              labelName={"Email address"}
              inputType={"email"}
              inputName={"emailAddress"}
              inputValue={userSignIn.values.emailAddress}
              inputOnBlur={userSignIn.handleBlur}
              inputOnChange={userSignIn.handleChange}
              inputError={
                userSignIn.touched.emailAddress &&
                userSignIn.errors.emailAddress
                  ? userSignIn.errors.emailAddress
                  : null
              }
            />
            <PasswordInput
              labelName={"Password"}
              inputType={"password"}
              inputName={"password"}
              inputValue={userSignIn.values.password}
              inputOnBlur={userSignIn.handleBlur}
              inputOnChange={userSignIn.handleChange}
              inputError={
                userSignIn.touched.password && userSignIn.errors.password
                  ? userSignIn.errors.password
                  : null
              }
            />
          </div>

          {userError && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              <span>{userError}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-4">
            <Buttons btnText={"Continue"} btnType={"primary"} type={"submit"} />
            <p className="text-sm font-medium text-brand underline cursor-pointer" onClick={() => { setSignInVisible(false); navigate('/login'); }}>
              Forgot password?
            </p>
          </div>
        </form>

        <p className="text-sm">
          Don't have an account?{" "}
          <span
            className="text-brand underline cursor-pointer"
            onClick={toggleSignUp}
          >
            Sign up
          </span>
        </p>
      </Modal>

      {/* Sign Up modal */}
      <Modal
        isVisible={signUpVisible}
        onClose={() => setSignUpVisible(false)}
        modalTitle={"Sign Up"}
        width={"md:w-[40%]"}
      >
        <form onSubmit={userSignUp.handleSubmit}>
          <InputWithLabel
            labelName={"Email address"}
            inputType={"email"}
            inputName={"emailAddress"}
            inputValue={userSignUp.values.emailAddress}
            inputOnBlur={userSignUp.handleBlur}
            inputOnChange={userSignUp.handleChange}
            inputError={
              userSignUp.touched.emailAddress && userSignUp.errors.emailAddress
                ? userSignUp.errors.emailAddress
                : null
            }
          />
          <div className="text-[13px] text-black/80 flex items-center gap-3 pt-2">
            <img src={info} alt="" className="h-5" />
            <span>
              Please ensure you provide a valid email address. A verification
              code will be sent to this email for you to complete the signup
              process.
            </span>
          </div>
          <div className="flex justify-between items-center mt-8">
            <Buttons
              btnType={"primary"}
              btnText={"Verify Email"}
              type={"submit"}
            />
            <p className="text-sm" onClick={toggleSignIn}>
              {" "}
              Return to {""}{" "}
              <span className="text-brand underline cursor-pointer">
                Sign in
              </span>
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hero;
