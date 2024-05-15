import { useEffect } from "react";
import brandIco from "../../../assets/svg-icons/brand-appointment-icon.svg";
import Appointments from "./upcomingAppointments";
import { useAllUserAppointments, useUserPendingAppointments } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";

const Dashboard = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Dashboard");
    document.title = "Dashboard - RapidStyler";
  }));

  const pendingAppointment = useUserPendingAppointments();
  const allAppointment = useAllUserAppointments();
  return (
    <div className="bg-white border rounded-lg">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="border-b p-4 text-[15px] font-bold bg-[#1d1d1d08] rounded-t-lg">Dashboard</div>
      {pendingAppointment.length > 0 && (
        <div className="p-4">
          <p className="text-sm font-semibold">Upcoming appointments:</p>
          {pendingAppointment.map((val, key) => (
            <Appointments appointmentDate={val?.appointmentDate}
                          serviceTime={val?.arrivalTime} 
                          serviceProvider={val.stylerData?.businessName}
                          serviceType={"Fix from backend"}
                          businessAddress={val.stylerData?.businessAddress}
                          serviceName={val.subServiceData?.name}
                          numberOfPeople={"666"}
                          appointmentStatus={val?.status}
                          appointmentPrice={val.subServiceData?.price}
                          key={key}
                          />
          ))}
        </div>
      )}
      <div className="p-4">
        <p className="text-sm font-semibold">All Appointment history:</p>
        <div className="grid gap-3 mt-4">
          {
            allAppointment.length > 0 ? (
              allAppointment.map((val, key) => {
                return (
                  <div className="grid grid-cols-12 gap-4 items-start pb-3 border-b last:border-0" key={key}>
                    <div className="grid grid-cols-10 items-center col-span-8">
                      <div className="col-span-2 md:col-span-1">
                        <img src={brandIco} className="h-10" alt="" />
                      </div>
                      <div className="grid col-span-8 md:col-span-9">
                        <span className="text-[15px] truncate">{val.stylerData?.businessName}</span>
                        <div><span className="font-semibold text-black/50 text-sm">Service:</span> <span className=" text-gray-400 text-sm">{val.subServiceData?.name}</span></div>
                        <div><span className="font-semibold text-black/50 text-sm">Appointment Status:</span> <span className=" text-gray-400 text-sm">{val?.status}</span></div>
                      </div>
                    </div>
                    <div className="col-span-4 text-end  grid">
                      <div><span className="font-semibold">{val.subServiceData?.price}</span> <span className=" text-gray-400">CAD</span></div>
                      <div><span className="font-semibold text-black/50 text-sm">Time:</span> <span className=" text-gray-400 text-sm">{val?.arrivalTime}</span></div>
                      <div><span className="font-semibold text-black/50 text-sm">Date:</span> <span className=" text-gray-400 text-sm">{val?.appointmentDate}</span></div>
                    </div>
                  </div>
                )
              })
            )
              :
              (
                <div>
                  No Appointments available yet, Kindly book an appointment
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
