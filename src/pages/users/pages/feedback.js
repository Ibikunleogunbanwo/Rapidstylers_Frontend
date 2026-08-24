// import arrow from "../assets/svg-icons/black-arrow.svg"
// import { Link } from "react-router-dom";
import { useEffect } from "react";
import Input from "../../../components/input";
import Buttons from "../../../components/button";
import { useFormik } from "formik";
import * as Yup from "yup"; 
import SelectInput from "../../../components/selectInput";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../components/spinner";
import { addUserFeedBack } from "../../../hooks/local/userReducer";
const Feedback = ({setPageTitle}) => {
  useEffect((() => {
    setPageTitle("Feedback");
    document.title = "Feedback | RapidStylers";
  }));
  const dispatch = useDispatch();
  const feedbackType = [{value:'', label:'Select...'},
                        { value: 'Improvement suggestion', label: 'Improvement suggestion' },
                        {value: 'Report a bug', label: 'Report a bug'}]

  const userEmailAddress = useSelector((state)=>state.user.userSessionData).emailAddress;
  const userId = useSelector((state)=>state.user.userSessionData).userId;
  const submitUserFeedback = useFormik({
    initialValues: {
      emailAddress: userEmailAddress,
      feedbackType: "",
      message: "",
    },
    validationSchema: Yup.object({
      emailAddress: Yup.string().email("Enter a valid email address").required("Email Address is required"),
      feedbackType: Yup.string().required("Feedback type is required"),
      message: Yup.string().required("Feedback content is required"),
    }),
    onSubmit: (values, {resetForm}) => {
      const {emailAddress, feedbackType, message} = values;
      let userFeedbackData = {userId, emailAddress, feedbackType, message};
      const { payload } = dispatch(addUserFeedBack(userFeedbackData));
      if(payload.statusCode === "200") {
        resetForm();
      }
    },
  })
  return (
    <div className="bg-white border rounded-lg">
          <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex gap-1 items-center border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">
        User feedback
      </div>
      <div className="p-4 grid gap-4">
        <p>
          We value your opinion and appreciate you taking the time to share your
          feedback. Your insights are crucial in helping us enhance our
          services. Please feel free to share your thoughts, suggestions, or
          experiences with us. Whether you have a positive story to tell or
          areas where we can improve, your feedback is invaluable.
        </p>
        <p>Feedback form:</p>
        <form onSubmit={submitUserFeedback.handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label={"Email"} 
                 type={"email"}
                 name={"emailAddress"}
                 onBlur={submitUserFeedback.handleBlur}
                 onChange={submitUserFeedback.handleChange}
                 value={submitUserFeedback.values.emailAddress}
                 onError={submitUserFeedback.errors.emailAddress && submitUserFeedback.touched.emailAddress? submitUserFeedback.errors.emailAddress : null}
           />
          <div className="grid gap-1">
            <SelectInput labelName={"Feedback Type"} 
                         selectOptions={feedbackType} 
                         valueKey={'value'} 
                         labelKey={'label'}
                         selectName={"feedbackType"}
                         selectBlur={submitUserFeedback.handleBlur}
                         onChange={(event)=>submitUserFeedback.setFieldValue('feedbackType',event.target.value)}
                         selectValue={submitUserFeedback.values.feedbackType}
                         selectError={submitUserFeedback.touched.feedbackType && submitUserFeedback.errors.feedbackType ? submitUserFeedback.errors.feedbackType : null} />
          </div>
          <div className="grid gap-1 col-span-1 md:col-span-2">
            <span className="font-medium text-sm">Your feedback</span>
            <textarea
              name="message"
              id=""
              onBlur={submitUserFeedback.handleBlur}
              onChange={submitUserFeedback.handleChange}
              value={submitUserFeedback.values.message}
              cols="30"
              rows="5"
              placeholder="Start typing..."
              className="w-full p-[15px] rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-0 placeholder:text-sm"
            ></textarea>
            <span className="text-xs text-red-600">{submitUserFeedback.errors.message && submitUserFeedback.touched.message ? submitUserFeedback.errors.message : null}</span>
          </div>
          <div className="col-span-1 md:col-span-2">
            <Buttons btnText={'Submit'} type={'submit'} btnType={'light'}/>
          </div>
          <div className="col-span-1 md:col-span-2 mt-3 text-slate-600">
            <p className=" font-semibold">Privacy note:</p>
            <p>
              Your feedback is confidential and will only be used for the
              purpose of improving our services. We respect your privacy, and
              any personal information provided will be handled in accordance
              with our privacy policy.
              <br /> <br />
              Thank you for being a part of our community and for helping us
              create a better experience for you and others. We value your
              feedback and look forward to serving you even better in the
              future.
            </p>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};

export default Feedback;
