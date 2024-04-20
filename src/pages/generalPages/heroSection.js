
import logo from "../../assets/svg-icons/logo.svg";
import search from "../../assets/svg-icons/search.svg";
import menu from "../../assets/svg-icons/menu-icon.svg";
import close from "../../assets/svg-icons/close.svg";
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
import { verifySignUpEmailAddress } from "../../hooks/local/userReducer";

const Hero = ({ height, landingTitle, elevateLooksTitle, caption, heroimg, landingHeroImg, titleAddOn }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Function to toggle the menu visibility
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Function to close the menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const [signInVisible, setSignInVisible] = useState(false);
  const [signUpVisible, setSignUpVisible] = useState(false);

  // Function to toggle the sign in modal
  const toggleSignIn = () => {
    setSignInVisible(!signInVisible);
    setMenuVisible(false);
    setSignUpVisible(false);
  };


  // Function to toggle the sign up modal
  const toggleSignUp = () => {
    setSignUpVisible(!signUpVisible);
    setSignInVisible(false);
    setMenuVisible(false);
  };

  const userSignUp = useFormik({
    initialValues: {
      emailAddress : ""
    },
    validationSchema : Yup.object({
      emailAddress : Yup.string().required("Email is required").email("Invalid Email Address")
    }),
    onSubmit: async (values) => {
       const {emailAddress} = values;
       let verifyUserEmailData = {emailAddress};
       const { payload } = await dispatch(verifySignUpEmailAddress(verifyUserEmailData));
       if(payload.statusCode === "200") {
          navigate("/verifyEmailAddress", {state : {emailAddress}});
       }
    }
  });
  const currentYear = new Date().getFullYear()

  return (
    <div style={{ height }} className="relative z-10">
      <Spinner loading={useSelector((state)=>state.user).loading}/>
      <div className="h-[100%] absolute w-full flex items-center overflow-hidden">
        <div className="w-full h-full relative">
          <div className="absolute w-full h-full flex top-0 items-center justify-center px-4  pt-[80px]">
            <div className="grid">
              <p className="text-2xl md:text-lg text-white w-full md:w-[60%] justify-self-center text-center">
                {landingTitle}
                <span className="hidden md:inline"> {titleAddOn}</span>
                <div className="text-3xl mb-2">{elevateLooksTitle}</div>
              </p>
              <p className="text-white w-full md:w-[60%] text-center justify-self-center">
                {caption}
              </p>
              <span
                className={`w-full md:w-[50%] lg:w-[30%] justify-self-center mt-4 p-5 md:p-3 rounded-[4px] bg-white flex items-center gap-3 ${document.title !== "Welcome - TrimTech" ? "hidden" : "block"
                  }`}
              >
                <img src={search} alt="" className="h-5" />
                <input
                  type="search"
                  className="w-full active:border-0 active:outline-0 focus:border-0 focus:outline-0 placeholder:text-sm"
                  placeholder="Search for a stylist"
                />
              </span>
            </div>
          </div>
          <div className="h-full">
            <img src={landingHeroImg} alt="" className={`w-full h-full object-cover ${document.title === "Welcome - RapidStylers" ? "block" : "hidden"}`} />
            <img src={heroimg} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      {/* Navbar */}
      <div className="fixed w-full flex items-center border-b border-[#ffffff32] bg-[#1d1d1d80] backdrop-blur-xl px-4 md:px-[50px] text-white py-5">
        <div className="w-full flex justify-between items-center">
          <Link to={"/"}>
            <img src={logo} alt="" className="h-12 md:h-10" />
          </Link>
          <div className="hidden md:block">
            <div className="flex items-center gap-8">
              <div className="flex items-center divide-x">
                <span className="pe-4 cursor-pointer" onClick={toggleSignIn}>Login</span>
                <span className="ps-4 cursor-pointer" onClick={toggleSignUp}>Create an account</span>
              </div>
            </div>
          </div>
          <div className="block md:hidden">
            <img src={menu} alt="" className="h-6" onClick={toggleMenu} />
          </div>
        </div>
      </div>
      {/* small screen menu */}
      <div className={`fixed w-full h-lvh pt-10 pb-40 px-4 grid content-between bg-[#1e1e1e] lg:hidden ${menuVisible ? "block" : "hidden"
        }`}
      >
        <div className="grid">
          <img
            src={close}
            alt=""
            onClick={closeMenu}
            className="h-6 justify-self-end cursor-pointer"
          />

          <div className="mt-10 grid gap-4">
            <div className="py-4 text-white rounded-md font-semibold flex justify-between items-center" onClick={toggleSignIn}>
              <span>Login</span>
              <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="rgba(255,255,255,1)"><path d="M12.1717 12.0005L9.34326 9.17203L10.7575 7.75781L15.0001 12.0005L10.7575 16.2431L9.34326 14.8289L12.1717 12.0005Z"></path></svg></span>
            </div>
            <div className="py-4 text-white rounded-md font-semibold flex justify-between items-center" onClick={toggleSignIn}>
              <span>Create an account</span>
              <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="rgba(255,255,255,1)"><path d="M12.1717 12.0005L9.34326 9.17203L10.7575 7.75781L15.0001 12.0005L10.7575 16.2431L9.34326 14.8289L12.1717 12.0005Z"></path></svg></span>
            </div>
            <div className="py-4 text-white rounded-md font-semibold flex justify-between items-center" onClick={toggleSignIn}>
              <span>Register as a stylist</span>
              <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="rgba(255,255,255,1)"><path d="M12.1717 12.0005L9.34326 9.17203L10.7575 7.75781L15.0001 12.0005L10.7575 16.2431L9.34326 14.8289L12.1717 12.0005Z"></path></svg></span>
            </div>
          </div>
        </div>
        <span className="text-white/60">
          © {currentYear} TrimTech All rights reserved
        </span>
      </div>
      {/* Sign in modal */}
      <Modal modalTitle={'Login'} 
            isVisible={signInVisible}
            onClose={()=>setSignInVisible(false)}
            width={"md:w-[40%] lg:w-[35%]"}>
            <InputWithLabel labelName={"Email address"} inputType={"email"} />
            <InputWithLabel labelName={"Password"} inputType={"password"} />

            <div className="flex justify-between items-center">
              <Buttons btnText={"Continue"} btnType={"primary"} />
              <p className="text-sm font-medium text-brand underline">
                Forgot password?
              </p>
            </div>

            <p className="text-sm">
              Don't have an account?{" "}
              <span className="text-brand underline cursor-pointer" onClick={toggleSignUp}>Sign up</span>
            </p>
      </Modal>

      {/* Sign Up modal */}
      <Modal isVisible={signUpVisible} 
             onClose={()=>setSignUpVisible(false)} 
             modalTitle={"Sign Up"}
             width={"md:w-[40%]"}>
        <form onSubmit={userSignUp.handleSubmit}>
          <InputWithLabel labelName={"Email address"} 
                          inputType={"email"}
                          inputName={"emailAddress"}
                          inputValue={userSignUp.values.emailAddress}
                          inputOnBlur={userSignUp.handleBlur}
                          inputOnChange={userSignUp.handleChange}
                          inputError={userSignUp.touched.emailAddress && userSignUp.errors.emailAddress ? userSignUp.errors.emailAddress : null} />
          <div className="text-[13px] text-black/80 flex items-center gap-3 pt-2">
            <img src={info} alt="" className="h-5" />
            <span>Please ensure you provide a valid email address. A verification code will be sent to this email for you to complete the signup process.</span>
          </div>
          <div className="flex justify-between items-center mt-8">
            <Buttons btnType={"primary"} btnText={"Verify Email"} type={"submit"} />
            <p className="text-sm" onClick={toggleSignIn}> Return to {""} <span className="text-brand underline cursor-pointer">Sign in</span></p>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Hero;
