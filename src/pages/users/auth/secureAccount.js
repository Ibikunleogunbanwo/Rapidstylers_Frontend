import logo from "../../../assets/svg-icons/colouredLogo.svg";
import sideImage from "../../../assets/images/signup.jpg";
import Buttons from "../../../components/button";
import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import PasswordInput from "../../../components/passwordInput";
import { useDispatch } from "react-redux";
import { createUserAccount, userAuthenticate } from "../../../hooks/local/userReducer";
import { useNavigate } from "react-router-dom";
const SecureAccount = () => {
  useEffect(() => {
    document.title = "Secure Account | Rapid Stylers";
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
        password: Yup.string().required("Password cannot be empty").matches(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?.&])[A-Za-z\d@$!%*#.?&]{6,}$/,
          "Password Criteria does't match"
        ),
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
        setDashboardModal(false);
        navigate("/dashboard")
      }
  }
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
              <div className="lg:flex items-center gap-1 lg:gap-4 hidden">
                <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">3</div>
                <div className="text-2xl lg:text-sm">Personal details</div>
              </div>
              <div className="grid lg:flex items-center gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-white text-white  flex items-center justify-center text-xs font-bold">4</div>
                <div className="opacity-40 flex lg:hidden">Step 4 0f 4</div>
                <div className="text-2xl lg:text-sm">Secure your account</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-1 lg:col-span-9 p-6">
        <div className="py-6 w-full">
          <img src={logo} alt="" className="h-10 mb-6" />
          <p className="text-xl">Secure your account.</p>
          <p className="text-black/60">
            Create a password with at least<span className="text-black"> 1 uppercase, 1 lowercase, 1 digit, 1 special character and 8 length.</span>
          </p>
          <form onSubmit={createAccountForm.handleSubmit}>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
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
            </div>
            <div className="mt-5">
              <Buttons btnText={"Create Account"} btnType={"primary"} type={"submit"} />
            </div>
          </form>
        </div>
      </div>
      {dashboardModal && (
        <div className="fixed bg-black/60 h-screen w-full px-4 flex items-center justify-center">
          <div className="bg-white rounded-md w-full md:w-[40%] flex flex-col items-center justify-center">
          <p className="">Account Created Successful, Proceed to Dashboard </p>
            <div className="px-6 py-8 grid gap-4">
              <Buttons btnText={"Go to Dashboard"} btnType={"primary"} type={"button"} onClick={()=>proceedToDashboard()} />
            </div>
          </div>
        </div>
      )}


    </div>


  );
};

export default SecureAccount;
