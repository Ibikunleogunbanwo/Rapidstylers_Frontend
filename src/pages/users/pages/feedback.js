import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Input from "../../../components/input";
import Button from "../../../components/button";
import { useFormik } from "formik";
import * as Yup from "yup";
import SelectInput from "../../../components/selectInput";
import { useDispatch, useSelector } from "react-redux";
import Spinner from "../../../components/spinner";
import Back from "../../../components/goBack";
import { addUserFeedBack } from "../../../hooks/local/userReducer";
import { showSuccessToastMessage } from "../../../utils/constant";

const MESSAGE_LIMIT = 1000;

/** What the reader gets after sending — the three beats of the real process. */
const WHAT_HAPPENS_NEXT = [
  "Every message goes to the team, not a void.",
  "Bugs get logged and fixed; suggestions go into planning.",
  "If we need more detail, we reply to the email above.",
];

const Feedback = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Feedback");
    document.title = "Feedback | RapidStylers";
  }), [setPageTitle]);
  const dispatch = useDispatch();
  const [submitError, setSubmitError] = useState("");
  const [sent, setSent] = useState(false);
  // SelectInput adds its own disabled "Select a ..." option, so no blank entry here.
  const feedbackType = [{ value: "Improvement suggestion", label: "Improvement suggestion" },
                        { value: "Report a bug", label: "Report a bug" }]
  // Editing again after a send means a new message, so the thank-you note goes away.
  const clearSent = (handler) => (event) => {
    setSent(false);
    handler(event);
  };

  const userEmailAddress = useSelector((state) => state.user.userSessionData)?.emailAddress || "";
  const userId = useSelector((state) => state.user.userSessionData)?.userId;
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
    onSubmit: async (values, { resetForm }) => {
      const { emailAddress, feedbackType, message } = values;
      let userFeedbackData = { userId, emailAddress, feedbackType, message };
      setSubmitError("");
      setSent(false);
      try {
        const action = await dispatch(addUserFeedBack(userFeedbackData));
        if (action.meta?.requestStatus === "rejected" || action.error || String(action.payload?.statusCode) !== "200") throw new Error("Feedback failed");
        resetForm();
        setSent(true);
        showSuccessToastMessage("Feedback sent, thank you");
      } catch (error) {
        setSubmitError("Unable to submit feedback. Please try again.");
      }
    },
  })
  const messageLength = submitUserFeedback.values.message.length;
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <Spinner loading={useSelector((state) => state.user).loading} />
      {/* Header: the same band as the other customer pages, with the chat mark
          that makes this page findable at a glance. */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <Back />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-700/10 text-violet-700">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5h8M8 14h5M21 12c0 4.418-4.03 8-9 8-1.02 0-1.99-.14-2.88-.4L4 21l1.28-3.41A7.36 7.36 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z" />
            </svg>
          </span>
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Feedback</h1>
            <p className="mt-0.5 text-xs text-gray-500">We read every note that comes through this page</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-12 lg:gap-8 lg:p-6">
        {/* The form is the page's one job, so it takes the wide column. */}
        <div className="lg:col-span-7">
          <p className="text-sm leading-relaxed text-gray-600">
            Something not working, or an idea that would make booking easier? Tell us
            here. Bug reports and suggestions both go straight to the team.
          </p>
          <form onSubmit={submitUserFeedback.handleSubmit} className="mt-5 grid gap-4">
            <div className="grid gap-3">
              <Input label={"Email"}
                     type={"email"}
                     name={"emailAddress"}
                     onBlur={submitUserFeedback.handleBlur}
                     onChange={clearSent(submitUserFeedback.handleChange)}
                     value={submitUserFeedback.values.emailAddress}
                     onError={submitUserFeedback.errors.emailAddress && submitUserFeedback.touched.emailAddress ? submitUserFeedback.errors.emailAddress : null}
              />
              <div className="grid gap-1">
                <SelectInput labelName={"Feedback type"}
                             labelSuffix=""
                             selectOptions={feedbackType}
                             valueKey={'value'}
                             labelKey={'label'}
                             selectName={"feedbackType"}
                             selectBlur={submitUserFeedback.handleBlur}
                             onChange={clearSent((event) => submitUserFeedback.setFieldValue('feedbackType', event.target.value))}
                             selectValue={submitUserFeedback.values.feedbackType}
                             selectError={submitUserFeedback.touched.feedbackType && submitUserFeedback.errors.feedbackType ? submitUserFeedback.errors.feedbackType : null} />
              </div>
            </div>
            <div className="grid gap-1">
              <label htmlFor="feedback-message" className="font-medium text-sm">Your feedback</label>
              <textarea
                name="message"
                id="feedback-message"
                onBlur={submitUserFeedback.handleBlur}
                onChange={clearSent(submitUserFeedback.handleChange)}
                value={submitUserFeedback.values.message}
                rows="6"
                maxLength={MESSAGE_LIMIT}
                placeholder="Start typing..."
                aria-describedby="feedback-message-count"
                className="w-full rounded-md border border-[#c4c4c440] bg-[#c4c4c410] p-3 text-sm placeholder:text-xs placeholder:font-extralight focus:outline-brand"
              ></textarea>
              {/* The count is tied to the field for screen readers, and sits
                  opposite the error so the row never jumps. */}
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs text-red-600">
                  {submitUserFeedback.errors.message && submitUserFeedback.touched.message ? submitUserFeedback.errors.message : null}
                </span>
                <span id="feedback-message-count" className="text-[11px] tabular-nums text-gray-400">
                  {messageLength}/{MESSAGE_LIMIT}
                </span>
              </div>
            </div>
            {submitError && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{submitError}</span>
              </div>
            )}
            {sent && (
              <p role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>Thanks, your feedback is on its way.</span>
              </p>
            )}
            <div>
              <Button text={submitUserFeedback.isSubmitting ? 'Submitting...' : 'Send feedback'} disabled={submitUserFeedback.isSubmitting} type={'submit'} variant="primary" />
            </div>
          </form>
        </div>

        {/* The aside answers the two questions a sender has after clicking:
            did it arrive, and what happens to it. */}
        <aside className="grid content-start gap-4 lg:col-span-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
            <p className="text-sm font-semibold text-gray-900">What happens next</p>
            <ol className="mt-3 grid gap-3">
              {WHAT_HAPPENS_NEXT.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-700/10 text-[11px] font-bold text-violet-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-gray-100 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-gray-400">
                <rect x="5" y="10.5" width="14" height="9.5" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2" />
              </svg>
              Privacy note
            </p>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Your feedback is confidential and only used to improve our services. Any
              personal information you share is handled in line with our{" "}
              <Link to="/privacy-policy" className="font-medium text-brand underline underline-offset-2 hover:text-violet-800">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Feedback;
