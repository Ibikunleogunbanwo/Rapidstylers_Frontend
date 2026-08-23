// import arrow from "../assets/svg-icons/black-arrow-back.svg"
import { useEffect } from "react";
import Back from "../../../components/goBack";
import PasswordInput from "../../../components/passwordInput";
import { useFormik } from "formik";
import * as Yup from "yup";
import Buttons from "../../../components/button";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../components/spinner";
import { changeUserPassword } from "../../../hooks/local/userReducer";

const ChangePassword = ({setPageTitle}) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Change password | RapidStylers";
  }));

  const dispatch = useDispatch();
  const userSessionData = useSelector((state)=>state.user.userSessionData);
  const updateUserPassword = useFormik({
    initialValues: {
      oldPassword: "",
      password: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      oldPassword: Yup.string().required("Old Password is required"),
      password: Yup.string().required("New Password cannot be empty").matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?.&])[A-Za-z\d@$!%*#?.&]{6,}$/,
        "Password criteria doesn't match"
      ),
      confirmPassword: Yup.string()
        .required('Confirm Password cannot be empty')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
    }),
    onSubmit: async (values,{resetForm}) => {
        const {password, confirmPassword,oldPassword} = values;
        let changePasswordData = {emailAddress:userSessionData.emailAddress, password,confirmPassword,oldPassword};
        const {payload} = dispatch(changeUserPassword(changePasswordData));
        if(payload.statusCode === "200"){
          resetForm();
        }
    },
  })

  return (
    <div className="bg-white rounded-lg border">
      <Spinner loading={useSelector((state)=>state.user).loading}/>
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Change password.</span>
      </div>
      <form onSubmit={updateUserPassword.handleSubmit}>
      <div className="px-4 pt-4">
      <PasswordInput labelName={"Old Password"}
                      inputValue={updateUserPassword.values.oldPassword}
                      inputName={"oldPassword"}
                      inputOnBlur={updateUserPassword.handleBlur}
                      inputOnChange={updateUserPassword.handleChange}
                      inputError={updateUserPassword.errors.oldPassword && updateUserPassword.touched.oldPassword ? updateUserPassword.errors.oldPassword : null}/>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <PasswordInput labelName={"New Password"}
                        inputValue={updateUserPassword.values.password}
                        inputName={"password"}
                        inputOnBlur={updateUserPassword.handleBlur}
                        inputOnChange={updateUserPassword.handleChange}
                        inputError={updateUserPassword.errors.password && updateUserPassword.touched.password ? updateUserPassword.errors.password : null}/>

        <PasswordInput labelName={"Confirm Password"}
                        inputValue={updateUserPassword.values.confirmPassword}
                        inputName={"confirmPassword"}
                        inputOnBlur={updateUserPassword.handleBlur}
                        inputOnChange={updateUserPassword.handleChange}
                        inputError={updateUserPassword.errors.confirmPassword && updateUserPassword.touched.confirmPassword ? updateUserPassword.errors.confirmPassword : null}/>
        <div>
          <Buttons type={"submit"} btnText={"Update Password"} btnType={"light"}/>
          </div>
      </div>
      </form>
      <div className="px-4 flex space-x-1">
        <span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="rgba(147,129,255,1)"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z"></path></svg></span>
        <span className="pb-2 opacity-50 italic text-xs">Password must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character and 6 character length</span>
      </div>
    </div>
  );
};

export default ChangePassword;
