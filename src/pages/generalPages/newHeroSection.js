
import logo from "../../assets/svg-icons/logo.svg";
import React, { useState, useEffect } from "react";
import info from "../../assets/svg-icons/info.svg";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Buttons from "../../components/button";
import InputWithLabel from "../../components/inputWithLabel";
import Modal from "../../components/modals";
import { useFormik } from "formik";
import * as Yup from "yup";
import Spinner from "../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import { verifySignUpEmailAddress } from "../../hooks/local/userReducer";
import SearchForStyler from "../../components/searchForStyler";
import { APIService } from "../../hooks/remote/apiService";
import { useUserLocation } from "../../context/LocationContext";
import largeVideo from "../../assets/Videos/large video.mp4";
import smallVideo from "../../assets/Videos/small video.mp4";

const Hero = ({ height }) => {
  const [services, setServices] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    APIService.getStylerType()
      .then((res) => {
        const items = res.data?.data || [];
        setServices(items.map((c) => c.serviceTypeName || c.serviceName || c.name || c.serviceType));
      })
      .catch(() => {});
  }, []);

  const [signUpVisible, setSignUpVisible] = useState(false);
  const [signUpRole, setSignUpRole] = useState("customer"); // customer | stylist | admin
  const [searchParams] = useSearchParams();

  // Auto-open the signup modal when arriving with ?signup=1 (e.g. from the login page)
  useEffect(() => {
    if (searchParams.get("signup")) {
      setSignUpVisible(true);
    }
  }, [searchParams]);

  // Function to toggle the sign up modal
  const toggleSignUp = () => {
    setSignUpVisible(!signUpVisible);
  };
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
        navigate("/verifyEmailAddress", { state: { emailAddress } });
      }
    }
  });

  return (
    <div style={{ height }} className="relative z-10">
      <Spinner loading={useSelector((state) => state.user).loading} />

      <div className="h-[100%] absolute w-full flex items-center overflow-hidden">
        <div className="w-full h-full relative">
          {/* Landing */}
          <div className={`h-full text- bg-emerald-300 relative ${document.title === "Welcome - RapidStylers" ? "block" : "hidden"}`}>
            <video autoPlay loop muted className="hidden md:block h-full w-full object-cover">
              <source src={largeVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <video autoPlay loop muted className="md:hidden h-full w-full object-cover">
              <source src={smallVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute top-0 w-full h-full bg-black/70 flex items-end justify-center md:justify-start">
              <div className="w-full md:w-[70%] lg:w-[50%] px-4 pb-6 pt-8 sm:px-6 sm:pb-10 md:ps-20 md:pb-20">
                <div className="text-[22px] sm:text-xl md:text-2xl lg:text-[28px] font-bold text-white text-center md:text-start mb-2 leading-snug">
                  Get convenient, <span className="text-brand">high-quality beauty services</span> without leaving your home
                </div>
                <div className="text-white/70 text-xs sm:text-sm md:text-base text-center md:text-start max-w-md mx-auto md:mx-0">
                  Our platform connects you with top-rated local beauty professionals for in-home appointments.
                </div>
                {services.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-1.5 sm:gap-2">
                    {services.map((service) => (
                      <span
                        key={service}
                        className="text-[10px] sm:text-[11px] md:text-xs font-medium bg-white/10 border border-white/30 text-white rounded-full px-2.5 sm:px-3 py-1"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                )}
                <SearchForStyler />
              </div>
            </div>
          </div>

          {/* Elevate your looks */}
          <div
            className={`relative ${
              document.title === "Elevate your looks | RapidStylers"
                ? "block"
                : "hidden"
            }`}
          >
            <div className="bg-saloonDoodle h-[60vh] w-full bg-[length:45%] md:bg-[length:20%] bg-repeat"></div>
            <div className="h-full w-full flex items-center justify-center absolute top-0 pt-[80px] text-white bg-black/80 text-center px-10">
              <div className="md:w-1/3">
                <p className="text-2xl font-bold mb-3">
                  Elevate your style
                </p>
                <p>
                  Explore our exclusive collection of trendsetting styles
                  for Men and Women.
                </p>
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
            <LocationBadge />
            <div className="flex items-center gap-2 sm:gap-3 md:divide-x md:text-sm text-[11px] sm:text-xs">
              <span className="md:pe-3 cursor-pointer hover:text-white/80 transition" onClick={() => navigate('/login')}>
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

      {/* Sign Up modal */}
      <Modal
        isVisible={signUpVisible}
        onClose={() => setSignUpVisible(false)}
        modalTitle={"Sign Up"}
        width={"md:w-[40%]"}
      >
        <form onSubmit={userSignUp.handleSubmit}>
          <p className="text-sm font-semibold text-gray-700 mb-2">I want to join as a</p>
          <div className="flex gap-2 mb-4">
            {[
              { value: "customer", label: "Customer" },
              { value: "stylist", label: "Stylist" },
            ].map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  if (role.value === "stylist") {
                    navigate("/styler-signup");
                    return;
                  }
                  setSignUpRole("customer");
                }}
                className={`flex-1 py-2 rounded-md text-xs font-semibold border transition-colors ${
                  signUpRole === role.value
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {signUpRole === "customer" && (
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
          )}
          {signUpRole === "stylist" && (
            <p className="text-[13px] text-black/80">
              You'll create your stylist profile with business details, services
              and pricing in the next steps.
            </p>
          )}

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
              btnText={signUpRole === "customer" ? "Verify Email" : "Continue"}
              type={"submit"}
            />
            <p className="text-sm" onClick={() => navigate('/login')}>
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

/** Shows the user's detected location in the navbar. */
const LocationBadge = () => {
  const { location } = useUserLocation();

  if (!location || location.loading) return null;

  const display = location.city
    ? `${location.city}${location.province ? ", " + location.province : ""}`
    : location.province || "";

  if (!display) return null;

  return (
    <span
      className="flex items-center gap-1 text-white/80 hover:text-white transition-colors shrink-0"
      title="Detected location"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <span className="hidden md:inline text-[11px] sm:text-xs truncate max-w-[140px]">{display}</span>
    </span>
  );
};

export default Hero;
