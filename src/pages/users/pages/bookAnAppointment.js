import { Link } from "react-router-dom";
import barber from "../../../assets/images/barbers.jpg";
import haidresser from "../../../assets/images/hairdresser.jpg";
import arrow from "../../../assets/svg-icons/arrow.svg";
import search from "../../../assets/svg-icons/search.svg";

const BookAppointment = () => {
  document.title = "Book an appointment - TrimTech";
  return (
    <div className="bg-white border rounded-lg">
      <div className="border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">Book an appointment.</div>
      <div className="p-4">
        <div className="text-sm grid gap-4 md:flex md:justify-between ">
          <p>
            Current location:{" "}
            <span className="font-medium text-brand">Los Santos</span>
          </p>
          <p className="text-brand">[ Change location ]</p>
        </div>
        <div className="my-6 overflow-hidden rounded-[4px]">
          <span className="border w-full rounded-[4px] bg-white flex items-center gap-3 p-1">
            <img src={search} alt="" className="h-5 ps-4" />
            <input
              type="search"
              className="w-full active:border-0 active:outline-0 focus:border-0 focus:outline-0 placeholder:text-sm"
              placeholder="Search for a stylist"
            />
            <button className="bg-brand text-sm h-full flex gap-2 items-center text-white py-4 md:py-3 px-5 rounded">
            <span>Search!</span>
          </button>
          </span>
        </div>
        <div className="mb-6">
          <p className="text-center text-slate-400">Or <br /> let the system decide</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-48 w-full rounded-t-md flex justify-center overflow-hidden">
              <img src={barber} alt="" className="w-full h-full object-cover"/>
            </div>
            <div className="bg-black rounded-b-md px-4 py-8 text-white">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Barber</span>
                <span>
                  <img src={arrow} alt="" className="h-8" />
                </span>
              </div>
              <p className="text-sm text-white/60">
                Unlock a fresher you. Match with a barber.
              </p>
            </div>
          </div>
          <div>
            <Link to={"/dashboard/choose-stylist"}>
            <div className="h-48 w-full rounded-t-md flex justify-center overflow-hidden">
              <img src={haidresser} alt="" className="w-full h-full object-cover"/>
            </div>
            <div className="bg-black rounded-b-md px-4 py-8 text-white">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Hairdresser</span>
                  <span>
                    <img src={arrow} alt="" className="h-8" />
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  Let us make your hair dreams become a reality.
                </p>
            </div>
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-red-500 font-semibold">Disclaimer.</p>
        <p className="text-red-400">
          Connecting with stylists outside the app can be risky. To ensure your
          safety and security, please only use our platform to book
          appointments.
        </p>
      </div>
    </div>
  );
};

export default BookAppointment;
