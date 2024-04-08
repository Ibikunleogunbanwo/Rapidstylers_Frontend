// import profile from "../../assets/svg-icons/profile.svg";
import logo from "../../assets/svg-icons/logo.svg";
import search from "../../assets/svg-icons/search.svg";
import menu from "../../assets/svg-icons/menu-icon.svg";
import close from "../../assets/svg-icons/close.svg";
import closeBlack from "../../assets/svg-icons/closeBlack.svg";
import Input from "../../components/input";
import React, { useState} from "react";
import info from "../../assets/svg-icons/info.svg";
import { Link } from "react-router-dom";

const Hero = ({ height, landingTitle, elevateLooksTitle, caption, heroimg, landingHeroImg, titleAddOn}) => {
  const [menuVisible, setMenuVisible] = useState(false);

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

  // Function to close the sign in modal
  const closeSignIn = () => {
    setSignInVisible(false);
  };

  // Function to toggle the sign up modal
  const toggleSignUp = () => {
    setSignUpVisible(!signUpVisible);
    setSignInVisible(false);
    setMenuVisible(false);
  };

  // Function to close the sign up modal
  const closeSignUp = () => {
    setSignUpVisible(false);
  };

  const currentYear = new Date().getFullYear()

  return (
    <div style={{ height }} className="relative z-10">
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
                className={`w-full md:w-[50%] lg:w-[30%] justify-self-center mt-4 p-5 md:p-3 rounded-[4px] bg-white flex items-center gap-3 ${
                  document.title !== "Welcome - TrimTech" ? "hidden" : "block"
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
            <img src={heroimg} alt="" className="w-full h-full object-cover"/>
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
      <div className={`fixed w-full h-lvh pt-10 pb-40 px-4 grid content-between bg-[#1e1e1e] lg:hidden ${
          menuVisible ? "block" : "hidden"
        }`}
      >
        <div className="grid">
          <img
            src={close}
            alt=""
            onClick={closeMenu}
            className="h-6 justify-self-end cursor-pointer"
          />
          {/* <div className="mt-20 text-center grid gap-8">
            <div
              className="py-4 px-8 bg-white text-brand rounded-md font-semibold"
              onClick={toggleSignIn}
            >
              Login / Sign up
            </div>
            <Link to={"/admin-create-account"} className="py-4 px-8 bg-white text-brand rounded-md font-semibold">
              Register as a stylist
            </Link>
          </div> */}
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
        {/* <div className="grid gap-12 text-center">
          <div className="grid px-10 text-slate-50">
            <img src={scissors} alt="" className="h-6 justify-self-center mb-3" />
            <p className="text-center">
              “I didn’t want to go out, but my hair looked too good to stay in.”
            </p>
            <p className="text-center">
              {" "}
              - <br /> Unknown
            </p>
          </div>
          <div className="gap-2 grid grid-cols-1">
            <img src={logo} alt="" className="justify-self-center h-16" />
            <span className="text-white/60">
              © {currentYear} TrimTech All rights reserved
            </span>
          </div>
        </div> */}
      </div>
      {/* Sign in modal */}
      <div
        className={`fixed bg-black/60 h-screen w-full px-4 flex items-center justify-center ${
          signInVisible ? "block" : "hidden"
        }`}
      >
        <div className="bg-white rounded-md w-full md:w-[40%] lg:w-[35%]">
          <div className="flex justify-between items-center py-4 px-6 border-b ">
            <span className="text-lg font-semibold">Login</span>
            <img
              src={closeBlack}
              onClick={closeSignIn}
              alt=""
              className="h-5 cursor-pointer"
            />
          </div>
          <div className="px-6 py-8 grid gap-6">
            <Input label={"Email address:"} type={"email"} />
            <Input label={"Password:"} type={"password"} />

            <div className="flex justify-between items-center">
              <button className="py-4 px-8 bg-brand rounded-md text-white font-semibold">
                Continue
              </button>
              <p className="text-sm font-medium text-brand underline">
                Forgot password?
              </p>
            </div>

            <p className="text-sm">
              Dont have an account?{" "}
              <span className="text-brand underline cursor-pointer" onClick={toggleSignUp}>Sign up</span>
            </p>
          </div>
        </div>
      </div>
      {/* Sign Up modal */}
      <div
        className={`fixed bg-black/60 h-screen w-full px-4 flex items-center justify-center ${
          signUpVisible ? "block" : "hidden"
        }`}
      >
        <div className="bg-white rounded-md w-full md:w-[40%]">
          <div className="flex justify-between items-center py-4 px-6 border-b ">
            <span className="text-lg font-semibold">Sign up</span>
            <img
              src={closeBlack}
              onClick={closeSignUp}
              alt=""
              className="h-5 cursor-pointer"
            />
          </div>
          <div className="px-6 py-8 grid gap-4">
            <Input label={"Email address:"} type={"email"} />
            <div className="text-[13px] text-black/80 flex items-center gap-3">
              <img src={info} alt="" className="h-5"/>
              <span>Please ensure you provide a valid email address. A verification code will be sent to this email for you to complete the signup process.</span>
            </div>
            <div className="flex justify-between items-center mt-8">
              <Link to={"/verify-otp"}><button className="py-4 px-8 bg-brand rounded-md text-white font-semibold">Verify email</button></Link>
              <p className="text-sm" onClick={toggleSignIn}> Return to {""} <span className="text-brand underline cursor-pointer">Sign in</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
