import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Advert from "../components/advert";
import Humour from "../components/trimTechHumour";
import logo from "../assets/svg-icons/colouredLogo.svg";
import menu from "../assets/svg-icons/menu-brand.svg";
import NavItems from "../components/navItems";
import close from "../assets/svg-icons/closeBlack.svg";

const AdminLayout = () => {
  const location = useLocation();

  const [menuVisible, setMenuVisible] = useState(false);

  // Function to toggle the menu visibility
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  // Function to close the menu
  const closeMenu = () => {
    setMenuVisible(false);
  };

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []); // Run once on component mount

  const formattedDateTime = currentDateTime.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  });

  return (
    <div className="relative">
      <div className="h-[80px] flex items-center justify-between bg-brand border-b border-[#c4c4c432] fixed w-full px-3 md:px-4 lg:px-10">
        <div className="flex items-start gap-4">
          <img
            src={menu}
            alt=""
            className="h-5 block lg:hidden cursor-pointer"
            onClick={toggleMenu}
          />
          <img src={logo} alt="" />
        </div>
        <div className="text-sm text-brand hidden md:block">
          {formattedDateTime}
        </div>
      </div>
      {/* Small screen menu */}
      <div
        className={`w-full fixed rounded-md lg:hidden ${
          menuVisible ? "block" : "hidden"
        }`}
      >
        <div className="bg-white p-8 m-2 rounded-md h-full shadow-md">
          <div className="flex justify-between">
            <img src={logo} alt="" />
            <img src={close} alt="" onClick={closeMenu} className="h-5" />
          </div>
          <div className="grid gap-6 mt-8 ">
            <div onClick={closeMenu}>
            <Link
              to="/dashboard"
              className={`py-4 rounded-md ${
                location.pathname === "/dashboard"
                  ? "text-brand cursor-default font-medium"
                  : "cursor-pointer text-black/50"
              }`}
            >
              Overview
            </Link>
            </div>
            <div onClick={closeMenu}>
            <Link
              to="/dashboard/book-appointment"
              className={`py-4 rounded-md ${
                location.pathname === "/dashboard/book-appointment"
                  ? "text-brand cursor-default font-medium"
                  : "cursor-pointer text-black/50"
              }`}
            >
              Appointments
            </Link>
            </div>
            <div onClick={closeMenu}>
            <Link
              to="/dashboard/account-settings"
              className={`py-4 rounded-md ${
                location.pathname === "/dashboard/account-settings"
                  ? "text-brand cursor-default font-medium"
                  : "cursor-pointer text-black/50"
              }`}
            >
              Account settings
            </Link>
            </div>
            <div onClick={closeMenu}>
            <Link
              to="/dashboard/feedback"
              className={`py-4 rounded-md ${
                location.pathname === "/dashboard/feedback"
                  ? "text-brand cursor-default font-medium"
                  : "cursor-pointer text-black/50"
              }`}
            >
              Feedback
            </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 pt-[80px]">
        <div className="ps-10 col-span-1 lg:col-span-2 hidden lg:block relative">
          <NavItems />
        </div>
        <div className="p-2 md:p-4 col-span-1 lg:col-span-10">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
            <div className="col-span-1 lg:col-span-7">
              <Outlet />
            </div>
            <div className="col-span-1 lg:col-span-3">
              <div className="grid md:grid-cols-2 lg:grid-cols-1 gap-4 p-4 md:p-0">
                <Humour />
                <Advert />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
