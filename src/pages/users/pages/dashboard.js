import { useEffect } from "react";
import brandIco from "../../../assets/svg-icons/brand-appointment-icon.svg";
import Appointments from "./upcomingAppointments";

const Dashboard = ({setPageTitle}) => {
  useEffect((() => {
    setPageTitle("Dashboard");
    document.title = "Dashboard - RapidStyler";
  }));
  return (
    <div className="bg-white border rounded-lg">
      <div className="border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">Dashboard</div>
      <div className="p-4">
        <p className="text-sm font-semibold">Upcoming appointments:</p>
        <Appointments />
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold">Appointment history:</p>
        <div className="grid gap-3 mt-4">
      <div className="grid grid-cols-10 gap-4 items-start pb-3 border-b last:border-0">
        <div className="grid grid-cols-10 items-center col-span-8">
          <div className="col-span-2 md:col-span-1">
            <img src={brandIco} className="h-10" alt="" />
          </div>
          <div className="grid col-span-8 md:col-span-9">
            <span className="text-[15px] truncate">Gentlemen's Quarters Barbershop Lorem ipsum dolor sit amet consectetur, adipisicing elit. Iusto aperiam aliquam accusamus necessitatibus ducimus ratione odit minima. Ratione illo veritatis molestias voluptatem officiis veniam repudiandae! Autem nemo assumenda quo at?</span>
            <span className="text-sm text-black/50">24 December, 20:00</span>
          </div>
        </div>
        <div className="col-span-2 text-end truncate">
          <span className="font-semibold">50</span> <span className=" text-gray-400">CAD</span>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-4 items-start pb-3 border-b last:border-0">
        <div className="grid grid-cols-10 items-center col-span-8">
          <div className="col-span-2 md:col-span-1">
            <img src={brandIco} className="h-10" alt="" />
          </div>
          <div className="grid col-span-8 md:col-span-9">
            <span className="text-[15px] truncate">Glamour Locks Salon</span>
            <span className="text-sm text-black/50">24 December, 20:00</span>
          </div>
        </div>
        <div className="col-span-2 text-end truncate">
          <span className="font-semibold">400</span> <span className=" text-gray-400">CAD</span>
        </div>
      </div>
      <div className="grid grid-cols-10 gap-4 items-start pb-3 border-b last:border-0">
        <div className="grid grid-cols-10 items-center col-span-8">
          <div className="col-span-2 md:col-span-1">
            <img src={brandIco} className="h-10" alt="" />
          </div>
          <div className="grid col-span-8 md:col-span-9">
            <span className="text-[15px] truncate">Hair Haven Studio</span>
            <span className="text-sm text-black/50">24 December, 20:00</span>
          </div>
        </div>
        <div className="col-span-2 text-end truncate">
          <span className="font-semibold">250</span> <span className=" text-gray-400">CAD</span>
        </div>
      </div>
    </div>
      </div>
    </div>
  );
};

export default Dashboard;
