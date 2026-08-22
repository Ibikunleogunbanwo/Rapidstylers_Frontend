import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import Input from "../../../components/input";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import Buttons from "../../../components/button";
import { getUserDetails, updateCardDetail, userAuthenticate } from "../../../hooks/local/userReducer";
import { decryptData } from "../../../utils/constant";
import GeneralModal from "../../../components/generalModal";
import PasswordInput from "../../../components/passwordInput";
import Spinner from "../../../components/spinner";

const CardDetails = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Update Card Details - Rapid Styler";
  }));

  const dispatch = useDispatch();
  const userData = useSelector((state) => state.user.userDetailsData).userCardData;
  const userCardName = userData.cardName !== null ? decryptData(userData?.cardName) : userData.cardName;
  const userCardNumber = userData.cardNumber !== null ? decryptData(userData?.cardNumber) : userData.cardNumber;
  const userCardExpirationDate = userData.expiryDate !== null ? decryptData(userData?.expiryDate) : userData.expiryDate;
  const userCardCVV = userData.cvv !== null ? decryptData(userData?.cvv) : userData.cardName;
  const userId = useSelector((state) => state.user.userSessionData).userId;
  const emailAddress = useSelector((state) => state.user.userSessionData).emailAddress;
  const [cardDetailsInputType, setCardDetailsInputType] = useState();
  const [cardInputDisabled, setCardInputDisabled] = useState(false);
  const [viewCardDetailsModal, setViewCardDetailsModal] = useState(false);

  useEffect(() => {
    setCardDetailsInputType(userCardName !== null ? "password" : "text");
    setCardInputDisabled(userCardName !== null ? true : false);
  }, [userCardName]);

  const verifyUserPassword = useFormik({
    initialValues: {
      password: "",
    },
    validationSchema: Yup.object({
      password: Yup.string().required("Kindly enter your password")
    }),
    onSubmit: async (values, {resetForm}) => {
      const { password } = values;
      let verifyData = { emailAddress, password };
      const { payload } = await dispatch(userAuthenticate(verifyData))
      if (payload.statusCode === "200") {
        resetForm();
        setCardDetailsInputType("text");
        setCardInputDisabled(false);
        setViewCardDetailsModal(false);
      }
    }
  })
  const updateUserCardDetails = useFormik({
    initialValues: {
      cardName: userCardName,
      cardNumber: userCardNumber,
      expiryDate: userCardExpirationDate,
      cvv: userCardCVV,
    },
    validationSchema: Yup.object({
      cardName: Yup.string().required("Cardholder name is required"),
      cardNumber: Yup.string()
        .required("Card number is required")
        .matches(/^[0-9]{12,16}$/, "Card number is not valid"), // Example for Visa cards
      expiryDate: Yup.string()
        .required("Expiry date is required")
        .matches(/^(0[1-9]|1[0-2])\/\d{4}$/, "Expiry date is not valid. Format should be MM/YYYY"), // Format MM/YYYY
      cvv: Yup.string()
        .required("CVV is required")
        .matches(/^[0-9]{3}$/, "CVV is not valid. It should be exactly 3 digits")
    }),
    onSubmit: async (values) => {
      const { cardName, cardNumber, expiryDate, cvv } = values;
      let cardDetailsData = { userId, cardName, cardNumber, expiryDate, cvv };
      const { payload } = await (dispatch(updateCardDetail(cardDetailsData)));
      if (payload.statusCode === "200") {
        dispatch(getUserDetails(userId));
        setCardDetailsInputType("password");
        setCardInputDisabled(true);
      }
    },
  })

  return (
    <div className="bg-white rounded-lg border">
          <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>{userCardName === null ? "Add" : "Update"} Card Details.</span>
      </div>
      <form onSubmit={updateUserCardDetails.handleSubmit}>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={"Cardholder name:"}
            type={cardDetailsInputType}
            name={"cardName"}
            disabled={cardInputDisabled}
            value={updateUserCardDetails.values.cardName}
            onBlur={updateUserCardDetails.handleBlur}
            onChange={updateUserCardDetails.handleChange}
            onError={updateUserCardDetails.errors.cardName && updateUserCardDetails.touched.cardName ? updateUserCardDetails.errors.cardName : null} />
          <Input label={"Card number:"}
            type={cardDetailsInputType}
            name={"cardNumber"}
            disabled={cardInputDisabled}
            value={updateUserCardDetails.values.cardNumber}
            onBlur={updateUserCardDetails.handleBlur}
            onChange={updateUserCardDetails.handleChange}
            onError={updateUserCardDetails.errors.cardNumber && updateUserCardDetails.touched.cardNumber ? updateUserCardDetails.errors.cardNumber : null} />
          <Input label={"Expiration date:"}
            type={cardDetailsInputType}
            name={"expiryDate"}
            disabled={cardInputDisabled}
            value={updateUserCardDetails.values.expiryDate}
            onBlur={updateUserCardDetails.handleBlur}
            onChange={updateUserCardDetails.handleChange}
            onError={updateUserCardDetails.errors.expiryDate && updateUserCardDetails.touched.expiryDate ? updateUserCardDetails.errors.expiryDate : null} />
          <Input label={"CVV:"}
            type={cardDetailsInputType}
            name={"cvv"}
            disabled={cardInputDisabled}
            value={updateUserCardDetails.values.cvv}
            onBlur={updateUserCardDetails.handleBlur}
            onChange={updateUserCardDetails.handleChange}
            onError={updateUserCardDetails.errors.cvv && updateUserCardDetails.touched.cvv ? updateUserCardDetails.errors.cvv : null} />
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm">By checking this box, you acknowledge that you have read and agree to the terms and conditions of our service. This includes understanding and consenting to our policies regarding the storage and usage of your provided data. Please take a moment to review our comprehensive terms and conditions, which outline the guidelines and expectations for the use of our platform. If you have any questions or concerns, feel free to contact our support team for clarification. Your use of this service is subject to compliance with these terms.</p>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" name="" id="" />
              <span className="mb-[2px] text-sm">I have read and agree to the terms and conditions.</span>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 flex  gap-x-3">
            {!cardInputDisabled && (
              <Buttons btnType={'light'} type={"submit"} btnText={`${userCardName === null ? "Add" : "Update"} card details`} />
            )}
            {cardInputDisabled && (
              <Buttons btnType={'light'} type={"button"} btnText="View / Update Card Details" onClick={() => setViewCardDetailsModal(true)} />
            )}
          </div>
        </div>
      </form>
      <GeneralModal isVisible={viewCardDetailsModal} onClose={() => setViewCardDetailsModal(false)} modalTitle={"View Card Details"}>
        <form onSubmit={verifyUserPassword.handleSubmit}>
          <PasswordInput labelName={"Enter your password"}
            inputName={"password"}
            inputValue={verifyUserPassword.values.password}
            placeholder={"Enter your password"}
            inputOnBlur={verifyUserPassword.handleBlur}
            inputOnChange={verifyUserPassword.handleChange}
            inputError={verifyUserPassword.errors.password && verifyUserPassword.touched.password ? verifyUserPassword.errors.password : null} />
          <div className="pt-6">
            <Buttons btnType={'light'} type={"submit"} btnText="Verify Account" />
          </div>
        </form>
      </GeneralModal>

    </div>

  );
}

export default CardDetails;