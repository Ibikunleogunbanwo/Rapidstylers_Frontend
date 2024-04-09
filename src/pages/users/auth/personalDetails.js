import Input from "../../../components/input";
import { Link } from "react-router-dom";
import logo from "../../../assets/svg-icons/colouredLogo.svg";
import sideImage from "../../../assets/images/signup.jpg";

const PersonalDetails = () => {
  document.title = "Registration - RapidStylers";
  const country = ['Canada']
  const province = ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'];

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
              
              <div className="grid lg:flex items-center gap-1 lg:gap-4">
                <div className="h-8 w-8 rounded-full border-2 border-white text-white hidden lg:flex items-center justify-center text-xs font-bold">3</div>
                <div className="opacity-40 flex lg:hidden">Step 3 0f 4</div>
                <div className="text-2xl lg:text-sm">Personal details</div>
              </div>
              <div className="lg:flex items-center gap-4 opacity-40 hidden">
                <div className="h-8 w-8 rounded-full border-2 border-white text-white  flex items-center justify-center text-xs font-bold">4</div>
                <div className="text-2xl lg:text-sm">Secure your account</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-span-1 lg:col-span-9 p-6">
        <div className="py-6 w-full">
          <img src={logo} alt="" className="h-10 mb-6" />
          <p className="text-xl">Personal details.</p>
          <p className="text-black/60">
            Please provide details about yourself.
          </p>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <Input label={"First name:"} type={"text"} placeholder={"e.g John"} />
            <Input label={"Last name:"} type={"text"} placeholder={"e.g Doe"} />
            <Input label={"Country:"} type={"text"} variant={"select"} options={country} />
            <Input label={"State / Province:"} type={"text"} variant={"select"} options={province} />
            <Input label={"Physcal address:"} type={"text"} />
            <Input label={"Phone number:"} type={"tel"} />
          </div>
          <div className="mt-8">
            <Link
              to={"/secure-account"}
              className="py-4 px-8 bg-brand rounded-md text-sm text-white font-semibold"
            >
              Verify
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetails;
