import more from "../../../assets/svg-icons/more.svg";
import close from "../../../assets/svg-icons/closeBlack.svg";
import React, { useState } from "react";
import Rating from "../../../components/rating";

const Appointments = ({appointmentDate, serviceTime, serviceProvider, serviceType, businessAddress,serviceName, numberOfPeople, appointmentStatus, appointmentPrice}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  // Function to toggle the menu visibility
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Function to close the menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const [userRating, setUserRating] = useState(0);

  const handleRatingChange = (newRating) => {
    // Do something with the new rating, e.g., update it in the state
    setUserRating(newRating);
  };

  return (
    <div className="">
      <div className="grid gap-3 mt-4">
        <div className="border rounded-lg text-sm py-4 divide-x grid grid-cols-12 gap-6">
          <div className=" flex items-center px-4 col-span-12 md:col-span-3 order-2 md:order-1">
            <div className="flex items-end md:items-center gap-4 md:gap-0 md:grid">
              <div className="grid">
                <span className="text-black/50">Date:</span>
                <span>{appointmentDate}</span>
              </div>
              <p className="mt-2">{serviceTime}</p>
            </div>
          </div>
          <div className="px-4 col-span-12 md:col-span-9 order-1 md:order-2">
            <div className="flex justify-between">
              <div className="text-xs flex items-center gap-1">
                <div className="bg-[#c4c4c4] rounded-full border h-[8px] w-[8px]"></div>
                <div className="text-[#c4c4c4]">{appointmentStatus}</div>
              </div>
              <div>
                <img
                  src={more}
                  alt=""
                  onClick={toggleMenu}
                  className="cursor-pointer h-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 md:mt-1">
              <div className="grid">
                <span className="text-black/50">Service provider:</span>
                <span className="truncate text-[15px]">{serviceProvider}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Amount:</span>
                <div className="flex gap-1 items-center">
                  <span className="truncate font-bold text-[15px]">{appointmentPrice}</span>
                  <span className="text-gray-400">CAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* appointment details */}
      <div
        className={`fixed w-full h-[100vh] top-0 bottom-0 left-0 right-0 ${
          menuVisible ? "block" : "hidden"
        }`}
      >
        <div className="bg-black/50 h-full w-full px-4 flex justify-center items-center">
          <div className="bg-white relative w-full md:w-[40%] lg:w-[35%] rounded-md border max-h-[60%] md:max-h-[80%] overflow-y-scroll">
            <div className="border-b sticky top-0 bg-white flex justify-between items-center px-6 py-5">
              <p className="font-semibold">Appointment details</p>
              <img
                src={close}
                alt=""
                className="h-6 cursor-pointer"
                onClick={closeMenu}
              />
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4 text-sm">
              <div className="grid">
                <span className="text-black/50">Service provider:</span>
                <span className="truncate">{serviceProvider}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Service type:</span>
                <span className="">{serviceType}</span>
              </div>
              <div className="col-span-2 grid">
                <div className="flex gap-2"><span className="text-black/50">Address:</span><span className="text-brand">[ Get directions ]</span></div>
                <span>{businessAddress}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Service name:</span>
                <span>{serviceName}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Price:</span>
                <span>{appointmentPrice} CAD</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Number of people:</span>
                <span className="">{numberOfPeople}</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Appointment status:</span>
                <span className="">{appointmentStatus}</span>
              </div>
              <div className="col-span-2 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#FF6347] text-white w-full rounded-md text-center py-4 text-md lg:text-sm">
                    Cancel appointment
                  </div>
                  <div className=" bg-brand/15 text-brand w-full rounded-md text-center py-4 text-md lg:text-sm">
                    Reschedule appointment
                  </div>
                </div>
              </div>
              <div className=" col-span-2">
                <hr className="mt-4 mb-6"/>
                <p className="text-sm text-center">Write a review:</p>
                <div className="w-full">
                  <Rating
                    maxRating={5}
                    initialRating={userRating}
                    onRatingChange={handleRatingChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;
