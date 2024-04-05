import more from "../assets/svg-icons/more.svg";
// import blackIco from "../assets/svg-icons/black-appointment-icon.svg";
import close from "../assets/svg-icons/closeBlack.svg";
import React, { useState } from "react";
import Rating from "../components/rating";

const Appointments = () => {
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
        {/* <div className="flex gap-4 items-center pb-3 border-b last:border-0">
        <img src={blackIco} alt="" className="h-12" />
        <div className="flex gap-4 justify-between items-center w-full">
          <div className="grid">
            <span className="truncate">Iya Bimbo Hairdresser</span>
            <span className="text-sm text-black/50">24 December, 20:00</span>
          </div>
          <img src={more} alt="" onClick={toggleMenu} className="cursor-pointer h-7"/>
        </div>
      </div> */}
        {/* <div className="flex gap-4 items-center pb-3 border-b last:border-0">
        <img src={blackIco} alt="" className="h-12" />
        <div className="flex gap-4 justify-between items-center w-full">
          <div className="grid">
            <span className="truncate">Charity Salon </span>
            <span className="text-sm text-black/50">24 December, 20:00</span>
          </div>
          <img src={more} alt="" onClick={toggleMenu} className="cursor-pointer h-7"/>
        </div>
      </div> */}
        <div className="border rounded-lg text-sm py-4 divide-x grid grid-cols-12 gap-6">
          <div className=" flex items-center px-4 col-span-12 md:col-span-3 order-2 md:order-1">
            <div className="flex items-end md:items-center gap-4 md:gap-0 md:grid">
              <div className="grid">
                <span className="text-black/50">Date:</span>
                <span>24 December, 2024</span>
              </div>
              <p className="mt-2">8:00 pm</p>
            </div>
          </div>
          <div className="px-4 col-span-12 md:col-span-9 order-1 md:order-2">
            <div className="flex justify-between">
              <div className="text-xs flex items-center gap-1">
                <div className="bg-[#c4c4c4] rounded-full border h-[8px] w-[8px]"></div>
                <div className="text-[#c4c4c4]">Waiting for confirmation</div>
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
                <span className="truncate text-[15px]">The Cutting Edge Barbershop</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Amount:</span>
                <div className="flex gap-1 items-center">
                  <span className="truncate font-bold text-[15px]">32.00</span>
                  <span className="text-gray-400">CAD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border rounded-lg text-sm py-4 divide-x grid grid-cols-12 gap-6">
          <div className="flex items-center px-4 col-span-12 md:col-span-3 order-2 md:order-1">
            <div className="flex items-end md:items-center gap-4 md:gap-0 md:grid ">
              <div className="grid">
                <span className="text-black/50">Date:</span>
                <span>28 December, 2024</span>
              </div>
              <p className="mt-2">9:00 am</p>
            </div>
          </div>
          <div className="px-4 col-span-12 md:col-span-9 order-1 md:order-2">
            <div className="flex justify-between">
              <div className="text-xs flex items-center gap-1">
                <div className="bg-emerald-500 rounded-full border h-[8px] w-[8px]"></div>
                <div className="text-emerald-500">Appointment confirmed</div>
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
                <span className="truncate text-[15px]">Shear Elegance Salon</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Amount:</span>
                <div className="flex gap-1 items-center">
                  <span className="truncate font-bold text-[15px]">200.00</span>
                  <span className="text-gray-400">CAD</span>
                </div>
              </div>
              <div className="py-4"><span className="bg-brand text-white text-xs p-3 rounded-md">Make payment</span></div>
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
                <span className="truncate">The Cutting Edge Barbershop</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Service type:</span>
                <span className="">Visit the barber</span>
              </div>
              <div className="col-span-2 grid">
                <div className="flex gap-2"><span className="text-black/50">Address:</span><span className="text-brand">[ Get directions ]</span></div>
                <span>19 Osadebe Street, Ogui New Layout/43 Street, Achara Layout</span>
              </div>
              <div className="col-span-2 grid">
                <span className="text-black/50">Service name:</span>
                <span>Haircut and beard - Guaranteed perfection (if e no fine, i will refund your money 💯)</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Number of people:</span>
                <span className="">5</span>
              </div>
              <div className="grid">
                <span className="text-black/50">Appointment status:</span>
                <span className="">Waiting for confirmation</span>
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
