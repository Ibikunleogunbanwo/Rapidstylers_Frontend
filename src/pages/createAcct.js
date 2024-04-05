import logo from "../assets/svg-icons/logo.svg";
import image from "../assets/images/signup.jpg";
// import check from "../assets/svg-icons/check.svg";
import Input from "../components/input";
import { Link } from "react-router-dom";

const CreateAccount = () => {
  const province = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="bg-white w-full col-span-1 lg:col-span-9 max-h-dvh overflow-y-scroll pb-16">
          <div className="p-6 bg-[#1e1e1e]">
            <div className="flex justify-center lg:justify-start">
              <Link to={"/"}>
                <img src={logo} alt="" className="h-16 lg:h-10" />
              </Link>
            </div>
          </div>
          <p className="text-black/70 p-6 text-sm text-center lg:text-start">
              Signing up is simple and free. Just provide some info and we'll
              match you with a 5-star specialist
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            <div><Input label={"First name:"} type={"text"} /></div>
            <div><Input label={"Last name:"} type={"text"} /></div>
            <div><Input label={"Email address:"} type={"email"} /></div>
            <div><Input label={"Country:"} type={"text"} /></div>
            <div><Input label={"State / Province:"} type={"text"} variant={"select"} options={province} /></div>
            <div className="col-span-1 md:col-span-2"><Input label={"Physical address:"} type={"text"} /></div>
            <div><Input label={"Phone number:"} type={"tel"} /></div>
            {/* <div><Input label={"How often do you visit a stylist?"} type={"text"} /></div> */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-4">
            <div><Input label={"Create a password:"} type={"password"} /></div>
            <div><Input label={"Confirm your password:"} type={"password"} /></div>
          </div>
          <div className="px-6 pb-8 text-sm">
            Your password should include (at least):
            <ul className="list-disc list-inside grid grid-cols-2 lg:flex gap-1 lg:gap-10 mt-2">
              <li>6 characters</li>
              <li>1 capital letter</li>
              <li>1 small letter</li>
              <li>1 special character</li>
            </ul>
          </div>
          <div className="px-6">
              <Link to={"/dashboard"}>
                <button className="py-4 px-8 bg-brand rounded-md text-white font-semibold">
                  Sign up!
                </button>
              </Link>
          </div>
        </div>
        <div className="col-span-1 lg:col-span-3 overflow-hidden hidden lg:block p-1 h-dvh relative bg-white">
          <img
            src={image}
            alt=""
            className="w-full h-full object-cover rounded-md"
          />
        </div>
      </div>
    );
}

export default CreateAccount;