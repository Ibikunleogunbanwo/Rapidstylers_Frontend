import { useState } from "react";
import brandIco from "../../assets/svg-icons/brand-appointment-icon.svg";
import more from "../../assets/svg-icons/more.svg";
import PendingAppointments from "./stylerComponents/pendingAppointments";

const StylerAppointments = () => {
    const [pendingAppointments, setPendingAppointments] = useState(true);
    const [pastAppointments, setPastAppointments] = useState(false);

    const togglePending = () => {
        setPendingAppointments(true);
        setPastAppointments(false);
    };

    const togglePast = () => {
        setPendingAppointments(false);
        setPastAppointments(true);
    };

    const activeStyle = "bg-brand text-white p-4 rounded-md font-medium";
    const inactiveStyle = "bg-gray-50 border rounded-md border p-4 text-gray-500";

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = () => {
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

    return (
      <div className="rounded-md border">
        <div className="border-b p-4 font-medium text-sm">
          My appointments:
        </div>
        <div className="p-4">
          <div className="text-xs flex gap-4">
            <div
              className={`p-2 cursor-pointer ${
                pendingAppointments ? activeStyle : inactiveStyle
              }`}
              onClick={togglePending}
            >
              Pending appointments
            </div>
            <div
              className={`p-2 cursor-pointer ${
                pastAppointments ? activeStyle : inactiveStyle
              }`}
              onClick={togglePast}
            >
              Past appointments
            </div>
          </div>

          {pendingAppointments && (
            <div className="mt-10 grid gap-6">
              <div className="grid grid-cols-12 gap-4 pb-3 border-b last:border-0">
                <div className="flex col-span-10 md:col-span-11 gap-4">
                  <div className="grid">
                    <span className="text-[15px] truncate">
                      Special haircut - (skin fade, blow out, mohawk)
                    </span>
                    <span className="text-sm text-black/50">
                      24 December, 20:00
                    </span>
                  </div>
                </div>
                <div className="cursor-pointer col-span-2 md:col-span-1 flex justify-end">
                  <img src={more} alt="" className="h-8 " onClick={openDetails}/>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 pb-3 border-b last:border-0">
                <div className="flex col-span-10 md:col-span-11 gap-4">
                  <div className="grid">
                    <span className="text-[15px] truncate">
                      Special haircut - (skin fade, blow out, mohawk)
                    </span>
                    <span className="text-sm text-black/50">
                      24 December, 20:00
                    </span>
                  </div>
                </div>
                <div className="cursor-pointer col-span-2 md:col-span-1 flex justify-end">
                  <img src={more} alt="" className="h-8 " />
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 pb-3 border-b last:border-0">
                <div className="flex col-span-10 md:col-span-11 gap-4">
                  <div className="grid">
                    <span className="text-[15px] truncate">
                      Special haircut - (skin fade, blow out, mohawk)
                    </span>
                    <span className="text-sm text-black/50">
                      24 December, 20:00
                    </span>
                  </div>
                </div>
                <div className="cursor-pointer col-span-2 md:col-span-1 flex justify-end">
                  <img src={more} alt="" className="h-8 " />
                </div>
              </div>
            </div>
          )}
          {pastAppointments && (
            <div className="mt-10 grid gap-6">
              <div className="flex justify-between gap-4 pb-3 border-b last:border-0">
                <div className="flex col-span-10 md:col-span-11 gap-4">
                  <div className="grid">
                    <span className="text-[15px] truncate">
                      Special haircut - (skin fade, blow out, mohawk)
                    </span>
                    <span className="text-sm text-black/50">
                      24 December, 20:00
                    </span>
                  </div>
                </div>
                <div className="cursor-pointer col-span-2 md:col-span-1 flex justify-end text-sm text-emerald-500 font-semibold">
                  Completed
                </div>
              </div>
              <div className="flex justify-between gap-4 pb-3 border-b last:border-0">
                <div className="flex col-span-10 md:col-span-11 gap-4">
                  <div className="grid">
                    <span className="text-[15px] truncate">
                      Special haircut - (skin fade, blow out, mohawk)
                    </span>
                    <span className="text-sm text-black/50">
                      24 December, 20:00
                    </span>
                  </div>
                </div>
                <div className="cursor-pointer col-span-2 md:col-span-1 flex justify-end text-sm text-rose-500 font-semibold">
                  Cancelled
                </div>
              </div>
            </div>
          )}
        </div>
    {/* Appointment details */}
    {isDetailsOpen && <PendingAppointments onclose={closeDetails} />}
      </div>
    );
}

export default StylerAppointments;
