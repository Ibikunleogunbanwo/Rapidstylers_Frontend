// import arrow from "../assets/svg-icons/black-arrow-back.svg"
import { useEffect } from "react";
import Back from "../../../components/goBack";
import Input from "../../../components/input";
import { useFormik } from "formik";
import * as Yup from "yup";
import Buttons from "../../../components/button";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../components/spinner";
import { getUserDetails, updateUserDetails } from "../../../hooks/local/userReducer";

const UpdateInformation = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Update personal information | RapidStylers";
  }));

  const dispatch = useDispatch();
  const userDetails = useSelector((state)=>state.user.userDetailsData).userData;
  const updatePersonalInformation = useFormik({
    initialValues: {
      emailAddress: userDetails.emailAddress,
      firstname: userDetails.firstname,
      lastname: userDetails.lastname,
      phoneNumber: userDetails.phoneNumber,
      address: userDetails.address,
      state: userDetails.state,
      country: userDetails.country,
    },
    validationSchema: Yup.object({
      firstname: Yup.string().matches(/^[A-Za-z]+$/, 'Firstname can only contain letters'),
      lastname: Yup.string()
        .matches(/^[A-Za-z]+$/, 'Lastname can only contain letters'),
      phoneNumber: Yup.string()
        .matches(/^[\d+]+$/, 'Phone number can only contain digits'),
      address: Yup.string().required('Address is required'),
    }),
    onSubmit: async (values) => {
        const {emailAddress, phoneNumber, firstname,lastname,country,address,state} = values;
        let updateUserData = {emailAddress, phoneNumber,firstname,lastname,country,address,state};
        const { payload } = await(dispatch(updateUserDetails(updateUserData)));
        if(payload.statusCode === "200") {
          dispatch(getUserDetails(userDetails.userId));
        }
    },
  });
  return (
    <div className="bg-white rounded-lg border">
      <Spinner loading={useSelector((state)=>state.user).loading}/>
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>Update personal information.</span>
      </div>

      <form onSubmit={updatePersonalInformation.handleSubmit}>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={"Firstname:"}
            type={"text"}
            name={"firstname"}
            onBlur={updatePersonalInformation.handleBlur}
            value={updatePersonalInformation.values.firstname}
            onChange={updatePersonalInformation.handleChange}
            onError={updatePersonalInformation.errors.firstname && updatePersonalInformation.touched.firstname ? updatePersonalInformation.errors.firstname : null} />
          <Input label={"Lastname:"}
            type={"text"}
            name={"lastname"}
            onBlur={updatePersonalInformation.handleBlur}
            value={updatePersonalInformation.values.lastname}
            onChange={updatePersonalInformation.handleChange}
            onError={updatePersonalInformation.errors.lastname && updatePersonalInformation.touched.lastname ? updatePersonalInformation.errors.lastname : null} />
          <Input label={"Phone number:"}
            type={"tel"}
            name={"phoneNumber"}
            onBlur={updatePersonalInformation.handleBlur}
            value={updatePersonalInformation.values.phoneNumber}
            onChange={updatePersonalInformation.handleChange}
            onError={updatePersonalInformation.errors.phoneNumber && updatePersonalInformation.touched.phoneNumber ? updatePersonalInformation.errors.phoneNumber : null} />
          <Input label={"Physical address:"}
            type={"text"}
            name={"address"}
            onBlur={updatePersonalInformation.handleBlur}
            value={updatePersonalInformation.values.address}
            onChange={updatePersonalInformation.handleChange}
            onError={updatePersonalInformation.errors.address && updatePersonalInformation.touched.address ? updatePersonalInformation.errors.address : null} />
          <Input label={"State:"}
            type={"text"}
            name={"state"}
            onBlur={updatePersonalInformation.handleBlur}
            value={updatePersonalInformation.values.state}
            onChange={updatePersonalInformation.handleChange}
            onError={updatePersonalInformation.errors.state && updatePersonalInformation.touched.state ? updatePersonalInformation.errors.state : null} />
          <Input label={"Country:"}
            type={"text"}
            name={"country"}
            onBlur={updatePersonalInformation.handleBlur}
            value={updatePersonalInformation.values.country}
            onChange={updatePersonalInformation.handleChange}
            onError={updatePersonalInformation.errors.country && updatePersonalInformation.touched.country ? updatePersonalInformation.errors.country : null} />
          <div>
            <Buttons btnType={"light"} btnText={"Update Information"} type={"submit"} /></div>
        </div>
      </form>
    </div>
  );
};

export default UpdateInformation;
