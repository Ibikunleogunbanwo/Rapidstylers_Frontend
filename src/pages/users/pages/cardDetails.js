import { useEffect } from "react";
import Back from "../../../components/goBack";
import Input from "../../../components/input";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import Buttons from "../../../components/button";
import { getUserDetails, updateCardDetail, updateUserDetails } from "../../../hooks/local/userReducer";

const CardDetails = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Account Settings");
    document.title = "Update Card Details - Rapid Styler";
  }));

  const dispatch =useDispatch();
  const userData = useSelector((state) => state.user.userDetailsData).userCardData;
  const userCardName = userData?.cardName;
  const userCardNumber = userData?.cardNumber;
  const userCardExpirationDate = userData?.expiryDate;
  const userCardCVV = userData?.cvv;
  const userId = useSelector((state) => state.user.userSessionData).userId;
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
      const {cardName, cardNumber, expiryDate,cvv} = values;
      let cardDetailsData = {userId, cardName,cardNumber,expiryDate,cvv};
      const { payload } = await(dispatch(updateCardDetail(cardDetailsData)));
      if(payload.statusCode === "200") {
        dispatch(getUserDetails(userId));
      }
    },
  })
  return (
    <div className="bg-white rounded-lg border">
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        <Back />
        <span>{userCardName === null ? "Add" : "Update"} Card Details.</span>
      </div>
      <form onSubmit={updateUserCardDetails.handleSubmit}>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label={"Cardholder name:"} 
               type={"text"}
               name={"cardName"}
               value={updateUserCardDetails.values.cardName}
               onBlur={updateUserCardDetails.handleBlur}
               onChange={updateUserCardDetails.handleChange}
               onError={updateUserCardDetails.errors.cardName && updateUserCardDetails.touched.cardName ? updateUserCardDetails.errors.cardName :null} />
        <Input label={"Card number:"} 
               type={"text"}
               name={"cardNumber"}
               value={updateUserCardDetails.values.cardNumber}
               onBlur={updateUserCardDetails.handleBlur}
               onChange={updateUserCardDetails.handleChange}
               onError={updateUserCardDetails.errors.cardNumber && updateUserCardDetails.touched.cardNumber ? updateUserCardDetails.errors.cardNumber :null} />
        <Input label={"Expiration date:"} 
               type={"text"}  
               name={"expiryDate"}
               value={updateUserCardDetails.values.expiryDate}
               onBlur={updateUserCardDetails.handleBlur}
               onChange={updateUserCardDetails.handleChange}
               onError={updateUserCardDetails.errors.expiryDate && updateUserCardDetails.touched.expiryDate ? updateUserCardDetails.errors.expiryDate :null} />
        <Input label={"CVV:"} 
               type={"text"} 
               name={"cvv"}
               value={updateUserCardDetails.values.cvv}
               onBlur={updateUserCardDetails.handleBlur}
               onChange={updateUserCardDetails.handleChange}
               onError={updateUserCardDetails.errors.cvv && updateUserCardDetails.touched.cvv ? updateUserCardDetails.errors.cvv :null} />
        <div className="col-span-1 md:col-span-2">
          <p className="text-sm">By checking this box, you acknowledge that you have read and agree to the terms and conditions of our service. This includes understanding and consenting to our policies regarding the storage and usage of your provided data. Please take a moment to review our comprehensive terms and conditions, which outline the guidelines and expectations for the use of our platform. If you have any questions or concerns, feel free to contact our support team for clarification. Your use of this service is subject to compliance with these terms.</p>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" name="" id="" />
            <span className="mb-[2px] text-sm">I have read and agree to the terms and conditions.</span>
          </div>
        </div>
        <div className="col-span-1 md:col-span-2">
          <Buttons btnType={'light'} type={"submit"} btnText={"Save payment details"} />
        </div>
      </div>
      </form>
    </div>
  );
}

export default CardDetails;