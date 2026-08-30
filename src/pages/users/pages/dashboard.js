import { useEffect } from "react";
import { Link } from "react-router-dom";
import brandIco from "../../../assets/svg-icons/brand-appointment-icon.svg";
import Appointments from "./upcomingAppointments";
import ReviewForm from "../../../components/reviewForm";
import GoodToKnow from "../../../components/goodToKnow";
import { useAllUserAppointments, useUserPendingAppointments } from "../userLayout/functionalEffects";
import Spinner from "../../../components/spinner";
import { useDispatch, useSelector } from "react-redux";
import { getUserDetails } from "../../../hooks/local/userReducer";
import { formatTime12 } from "../../../utils/constant";

const Dashboard = ({ setPageTitle }) => {
  useEffect((() => {
    setPageTitle("Dashboard");
    document.title = "Dashboard | RapidStylers";
  }));

  const dispatch = useDispatch();
  const pendingAppointment = useUserPendingAppointments();
  const allAppointment = useAllUserAppointments();
  const userDetails = useSelector((state) => state.user.userDetailsData)?.userData || null;
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  useEffect(() => {
    if (userDetails) return;
    dispatch(getUserDetails()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A minimal (email+password) account has no name/phone/address yet.
  const missingName = !userDetails?.firstname || !userDetails?.lastname;
  const missingPhone = !userDetails?.phoneNumber;
  const missingAddress = !userDetails?.address;

  return (
    <div className="bg-white border border-[#1d1d1d0a] rounded-2xl shadow-sm overflow-hidden">
      <Spinner loading={useSelector((state) => state.user).loading} />
      <div className="flex items-center justify-between border-b border-[#1d1d1d0a] px-5 py-4 bg-gradient-to-r from-[#9381ff10] to-transparent">
        <p className="text-[15px] font-bold">Dashboard</p>
        <p className="text-xs text-gray-400">{today}</p>
      </div>
      {(missingName || missingPhone || missingAddress) && userDetails && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-amber-100 bg-amber-50 px-5 py-3.5">
          <div className="flex items-start gap-2.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" aria-hidden="true">
              <path d="M12 15v2m0 4h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
              <path d="M12 7v5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-amber-900">Complete your profile</p>
              <p className="text-xs text-amber-800 mt-0.5">
                Add your {[missingName && "name", missingPhone && "phone", missingAddress && "address"].filter(Boolean).join(", ") || "name, phone and address"} so stylists can reach you about bookings.
              </p>
            </div>
          </div>
          <Link
            to="/updatePersonal"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Complete profile
          </Link>
        </div>
      )}
      {pendingAppointment.length > 0 && (
        <div className="p-4">
          <p className="text-sm font-semibold">Upcoming appointments:</p>
          {pendingAppointment.map((val, key) => (
            <Appointments appointmentDate={val?.appointmentDate}
                          arrivalTime={formatTime12(val?.arrivalTime)}
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
                          baseTravelFee={val?.baseTravelFee}
                          appointmentId={val?.appointmentId}
                          statusCode={val?.statusCode}
                          paymentStatus={val?.paymentStatus}
                          paymentFailureCode={val?.paymentFailureCode}
                          refundId={val?.refundId}
                          refundStatus={val?.refundStatus}
                          refundAmount={val?.refundAmount}
                          refundCompletedAt={val?.refundCompletedAt}
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
                        {val?.refundStatus === "COMPLETED" && (
                          <div className="text-xs font-semibold text-emerald-600">
                            Refunded {val?.refundAmount ? `$${val.refundAmount} CAD` : ""} {val?.refundCompletedAt ? `on ${val.refundCompletedAt}` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-span-4 text-end  grid">
                      <div><span className="font-semibold">{val?.price || val.subServiceData?.price}</span> <span className=" text-gray-400">CAD</span></div>
                      <div><span className="font-semibold text-black/50 text-sm">Time:</span> <span className=" text-gray-400 text-sm">{formatTime12(val?.arrivalTime)}</span></div>
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
      {/* Pricing & cancellation basics — visible right where bookings live. */}
      <div className="p-4 border-t border-[#1d1d1d0a]">
        <GoodToKnow />
      </div>
    </div>
  );
};

export default Dashboard;
