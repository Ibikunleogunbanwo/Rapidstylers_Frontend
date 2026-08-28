
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
import LocationPicker from "../../components/locationPicker";
import { APIService } from "../../hooks/remote/apiService";
import { useUserLocation } from "../../context/LocationContext";
import largeVideo from "../../assets/Videos/large video.mp4";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    setMobileMenuOpen(false);
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
    <div className="relative z-10 lg:h-[var(--hero-h)]" style={{ "--hero-h": height }}>
      <Spinner loading={useSelector((state) => state.user).loading} />

      <div className="w-full lg:h-full overflow-hidden">
        <div className="w-full lg:h-full relative">
          {/* Landing */}
          <div className={`relative flex flex-col w-full lg:block lg:h-full ${document.title === "Welcome - RapidStylers" ? "" : "hidden"}`}>
            {/* Video band: 16:9 frame so the video is always well-framed (no awkward crop); full-bleed on large */}
            <div className="relative w-full aspect-video shrink-0 lg:h-full lg:aspect-auto">
              <video autoPlay loop muted playsInline className="h-full w-full object-cover">
                <source src={largeVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            {/* Text: below the image on small/medium; overlaid on the video on large */}
            <div className="grow bg-black lg:bg-transparent lg:grow-0 lg:absolute lg:inset-0 lg:flex lg:items-end lg:justify-start">
              <div className="px-4 py-10 sm:px-8 md:px-12 text-center lg:w-[72%] xl:w-[55%] lg:px-0 lg:ps-20 lg:pb-20 lg:text-start">
                <div className="text-[22px] sm:text-xl md:text-2xl lg:text-[28px] font-bold text-white text-center lg:text-start mb-2 leading-snug">
                  Get convenient, <span className="text-brand">high-quality beauty services</span> without leaving your home
                </div>
                <div className="text-white/70 text-xs sm:text-sm md:text-base text-center lg:text-start max-w-md mx-auto lg:mx-0">
                  Our platform connects you with top-rated local beauty professionals for in-home appointments.
                </div>
                {services.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center lg:justify-start gap-1.5 sm:gap-2">
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
      <header className="fixed top-0 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl text-white z-20">
        <div className="mx-auto flex min-h-[64px] w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 md:min-h-[76px] md:px-10 lg:px-[50px]">
          <Link to="/" aria-label="RapidStylers home" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="shrink-0">
            <img src={logo} alt="RapidStylers" className="h-8 w-auto sm:h-10" />
          </Link>
          <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
            <LocationBadge />
            <nav className="hidden items-center gap-4 text-sm md:flex md:gap-6" aria-label="Primary navigation">
              <button type="button" className="cursor-pointer transition hover:text-white/80" onClick={() => navigate('/login')}>Login</button>
              <button type="button" className="cursor-pointer transition hover:text-white/80" onClick={toggleSignUp}>Sign up</button>
              <button type="button" className="cursor-pointer whitespace-nowrap transition hover:text-white/80" onClick={() => navigate('/styler-signup')}>Register as a beauty professional</button>
            </nav>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 md:hidden"
            >
              <span className="sr-only">Menu</span>
              <span className="text-xl leading-none">{mobileMenuOpen ? "×" : "☰"}</span>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-white/10 bg-black/90 px-4 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto grid max-w-[1600px] gap-1">
              <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}>Login</button>
              <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold hover:bg-white/10" onClick={toggleSignUp}>Sign up</button>
              <button type="button" className="rounded-lg px-3 py-3 text-left text-sm font-semibold text-brand hover:bg-white/10" onClick={() => { setMobileMenuOpen(false); navigate('/styler-signup'); }}>Register as a beauty professional</button>
            </div>
          </nav>
        )}
      </header>

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

/** Shows the user's location in the navbar; click to change it. */
const LocationBadge = () => {
  const { location } = useUserLocation();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!location || location.loading) return null;

  const display = location.city
    ? `${location.city}${location.province ? ", " + location.province : ""}`
    : location.province || "";

  if (!display) return null;

  return (
    <>
      <button
        onClick={() => setPickerOpen(true)}
        className="flex items-center gap-1 text-white/80 hover:text-white transition-colors shrink-0 cursor-pointer"
        title="Change location"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span className="hidden md:inline text-[11px] sm:text-xs truncate max-w-[140px]">{display}</span>
      </button>
      {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
    </>
  );
};

export default Hero;
