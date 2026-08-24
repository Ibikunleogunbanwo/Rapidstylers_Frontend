import { useEffect } from "react";
import brandIco from "../../../assets/svg-icons/brand-appointment-icon.svg";
import Appointments from "./upcomingAppointments";
import ReviewForm from "../../../components/reviewForm";
import { useAllUserAppointments, useUserPendingAppointments } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useSelector } from "react-redux";

const Dashboard = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Dashboard");
    document.title = "Dashboard | RapidStylers";
  }));

  const pendingAppointment = useUserPendingAppointments();
  const allAppointment = useAllUserAppointments();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return (
    <div className="bg-white border border-[#1d1d1d0a] rounded-2xl shadow-sm overflow-hidden">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center justify-between border-b border-[#1d1d1d0a] px-5 py-4 bg-gradient-to-r from-[#9381ff10] to-transparent">
        <p className="text-[15px] font-bold">Dashboard</p>
        <p className="text-xs text-gray-400">{today}</p>
      </div>
      {pendingAppointment.length > 0 && (
        <div className="p-4">
          <p className="text-sm font-semibold">Upcoming appointments:</p>
          {pendingAppointment.map((val, key) => (
            <Appointments appointmentDate={val?.appointmentDate}
                          serviceTime={val?.arrivalTime} 
                          serviceProvider={val.stylerData?.businessName}
                          stylerId={val.stylerData?.stylerId}
                          serviceType={val.subServiceData?.serviceTypeName || "Service"}
                          businessAddress={val.stylerData?.businessAddress}
                          serviceName={val.subServiceData?.name}
                          numberOfPeople={val?.noOfPeople || "1"}
                          appointmentStatus={val?.status}
                          appointmentPrice={val?.price || val.subServiceData?.price}
                          servicePrice={val?.servicePrice}
                          travelFee={val?.travelFee}
                          includedTravelKm={val?.includedTravelKm}
                          billableTravelKm={val?.billableTravelKm}
                          travelDistanceKm={val?.travelDistanceKm}
                          extraTravelRatePerKm={val?.extraTravelRatePerKm}
                          appointmentId={val?.appointmentId}
                          statusCode={val?.statusCode}
                          key={key}
                          />
          ))}
        </div>
      )}
      <div className="p-4">
        <p className="text-sm font-semibold">Appointment history</p>
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
                      <div><span className="font-semibold">{val?.price || val.subServiceData?.price}</span> <span className=" text-gray-400">CAD</span></div>
                      <div><span className="font-semibold text-black/50 text-sm">Time:</span> <span className=" text-gray-400 text-sm">{val?.arrivalTime}</span></div>
                      <div><span className="font-semibold text-black/50 text-sm">Date:</span> <span className=" text-gray-400 text-sm">{val?.appointmentDate}</span></div>
                    </div>
                    {val?.statusCode === "0" && (
                      <div className="col-span-12">
                        <ReviewForm
                          bookingId={val?.appointmentId}
                          stylerId={val.stylerData?.stylerId}
                          onDone={() => setTimeout(() => window.location.reload(), 1200)}
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )
              :
              (
                <div className="text-center py-10">
                  <div className="grid place-items-center h-14 w-14 mx-auto rounded-full bg-[#9381ff1a] text-[#9381FF]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-700">No appointments yet</p>
                  <p className="text-sm text-gray-400 mt-1">Book one to get started. Discover professionals near you.</p>
                </div>
              )
          }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
