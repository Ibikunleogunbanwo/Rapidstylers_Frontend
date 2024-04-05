// import arrow from "../assets/svg-icons/black-arrow.svg"
// import { Link } from "react-router-dom";
import Input from "../components/input";

const Feedback = () => {
  document.title = "User feedback - TrimTech";
  return (
    <div className="bg-white border rounded-lg">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label={"Email"} type={"email"} />
          <div className="grid gap-1">
            <span className="font-medium text-sm">Feedback type:</span>
            <select
              name=""
              id=""
              className="w-full p-[15px] rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-0"
            >
              <option value="" selected disabled>
                Select an option
              </option>
              <option value="positive feedback">Positive feedback</option>
              <option value="improvement suggestion">
                Improvement suggestions
              </option>
              <option value="report a bug">Report a bug</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid gap-1 col-span-1 md:col-span-2">
            <span className="font-medium text-sm">Your feedback</span>
            <textarea
              name=""
              id=""
              cols="30"
              rows="5"
              placeholder="Start typing..."
              className="w-full p-[15px] rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-0 placeholder:text-sm"
            ></textarea>
          </div>
          <div className="col-span-1 md:col-span-2">
            <button className="bg-brand px-6 py-4 md:py-3 text-sm text-white rounded-md">
              Submit
            </button>
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
      </div>
    </div>
  );
};

export default Feedback;
