// import arrow from "../assets/svg-icons/black-arrow-back.svg"
import { useEffect } from "react";
import Back from "../../../components/goBack";
import PasswordInput from "../../../components/passwordInput";
import PasswordRequirements from "../../../components/passwordRequirements";
import { passwordProblem } from "../../../utils/passwordRule";
import { useFormik } from "formik";
import * as Yup from "yup";
import Button from "../../../components/button";
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
      // The same rule as signup, read from the server's own behaviour. This field
      // used to take six characters and its own list of symbols, so it accepted
      // passwords the server refuses, including one built on `%`.
      password: Yup.string()
        .required("New Password cannot be empty")
        .test("password-rule", ({ value }) => passwordProblem(value) || "", (value) =>
          passwordProblem(value) === null
        ),
      confirmPassword: Yup.string()
        .required('Confirm Password cannot be empty')
        .oneOf([Yup.ref('password'), null], 'Passwords must match'),
    }),
    onSubmit: async (values,{resetForm}) => {
        const {password, confirmPassword,oldPassword} = values;
        let changePasswordData = {emailAddress:userSessionData.emailAddress, password,confirmPassword,oldPassword};
        const { payload } = await dispatch(changeUserPassword(changePasswordData));
        if (payload?.statusCode === "200") {
          resetForm();
        }
    },
  })

  return (
    <div className="rounded-lg border border-black/10 bg-white">
      <Spinner loading={useSelector((state)=>state.user).loading}/>
      <div className="border-b border-black/10 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <Back />
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted">Account</p>
            <h1 className="mt-2 text-[clamp(1.25rem,2.5vw,1.75rem)] font-normal leading-[1.1] tracking-[-0.02em] text-onSurface">
              Change password
            </h1>
            <p className="mt-1.5 text-[13px] text-black/55">
              Enter your current password, then choose the new one.
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={updateUserPassword.handleSubmit} className="p-5 sm:p-6">
        <PasswordInput labelName={"Old Password"}
                        inputValue={updateUserPassword.values.oldPassword}
                        inputName={"oldPassword"}
                        inputOnBlur={updateUserPassword.handleBlur}
                        inputOnChange={updateUserPassword.handleChange}
                        inputError={updateUserPassword.errors.oldPassword && updateUserPassword.touched.oldPassword ? updateUserPassword.errors.oldPassword : null}/>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        {/* The list the person watches turn, from the same rule that validates the
            field, so it cannot describe a rule the server does not enforce. */}
        <PasswordRequirements value={updateUserPassword.values.password} />
        <div className="mt-6">
          <Button type={"submit"} text={"Update Password"} variant="primary"/>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
