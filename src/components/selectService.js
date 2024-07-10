import close from "../assets/svg-icons/closeBlack.svg";
import React, { useEffect, useState } from "react";
import Input from "../components/input"

const SelectService = ({serviceName, servicePrice, stylerId, subServiceId}) => {
  const [bookAppointmentForm, setBookAppointmentForm] = useState(false);

  // Function to toggle booking form
  const toggleBookingForm = () => {
    setBookAppointmentForm(!bookAppointmentForm);
  };
  // Function to close booking form
  const closeBookingForm = () => {
    setBookAppointmentForm(false);
  };

  // Function to select service type
  const [selectedOption, setSelectedOption] = useState("visitBarber");

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const [selectedTime, setSelectedTime] = useState(null);
  const timeArray = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 9;
    return `${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 ? "am" : "pm"}`;
  });

  // --------------------------------------------------------------------------

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getOrdinalSuffix = (number) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = number % 100;
    return number + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const [selectedDay, setSelectedDay] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentDay = new Date().getDate();

  const [selectedMonth, setSelectedMonth] = useState(months[currentMonthIndex]);
  const [daysInMonth, setDaysInMonth] = useState(
    generateDaysInMonth(currentYear, currentMonthIndex)
  );

  const handleMonthChange = (event) => {
    const selected = event.target.value;
    setSelectedMonth(selected);

    // Reset selected day to null when a different month is selected
    setSelectedDay(null);

    // Generate days for the selected month
    const days = generateDaysInMonth(currentYear, months.indexOf(selected));
    setDaysInMonth(days);
  };

  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [tipAmount, setTipAmount] = useState("0");
  const [totalPrice, setTotalPrice] = useState(0);
  useEffect(()=>{
    const parsedServicePrice = parseFloat(servicePrice.replace(/,/g, ''));
    const parseTipAmount = parseFloat(tipAmount.replace(/,/g, ''));
    const newTotalPrice = (numberOfPeople * parsedServicePrice) + parseTipAmount;
    setTotalPrice(newTotalPrice);
  },[numberOfPeople,servicePrice,tipAmount])

  return (
    <div className="">
      <div className="grid gap-3 mt-3">
        <div className="grid gap-3 pb-4 border-b">
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-8 md:col-span-10 text-black/50">
              {serviceName}
            </div>
            <div className="col-span-4 md:col-span-2 text-end text-brand">
              ${servicePrice}
            </div>
          </div>
          <div>
            <button
              className="px-4 py-2 rounded-md bg-brand text-white text-sm"
              onClick={toggleBookingForm}
            >
              Book service
            </button>
          </div>
        </div>

      </div>
      {/* book appointment form */}
      <div
        className={`fixed w-full h-[100vh] top-0 bottom-0 left-0 right-0 ${
          bookAppointmentForm ? "block" : "hidden"
        }`}
      >
        <div className="bg-black/50 h-full w-full px-4 flex justify-center items-center">
          <div className="bg-white relative w-full md:w-[40%] lg:w-[35%] rounded-md border max-h-[60%] md:max-h-[80%] overflow-y-scroll">
            <div className="border-b sticky top-0 bg-white flex justify-between p-6">
              <select
                className="active:outline-0 focus:outline-0 text-md font-semibold bg-white"
                onChange={handleMonthChange}
                value={selectedMonth}
              >
                <option value="" disabled>
                  Select a month
                </option>
                {months.map((month, index) => (
                  <option key={index} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <img
                src={close}
                alt=""
                className="h-6"
                onClick={closeBookingForm}
              />
            </div>
            <div className="space-y-6 py-6">
            <div className="px-6">
              <p className="font-semibold text-[15px]">Select date:</p>
              {/* <MonthDropdown /> */}
              {/* {selectedMonth && (
                  <div className="flex overflow-x-scroll gap-2 pb-2">
                    {daysInMonth.map((day) => {
                      const currentDate = new Date(
                        currentYear,
                        months.indexOf(selectedMonth),
                        day
                      );
                      const isPastDay =
                        currentDate <
                        new Date(currentYear, currentMonth, currentDay);

                      return (
                        <div key={day} className={`border rounded-md h-[60px] ${isPastDay ? "hidden" : "block" } ${day === selectedDay ? "bg-brand cursor-default text-white" : "bg-white cursor-pointer"}`} onClick={() => setSelectedDay(day)} >
                          <div className="w-[80px] text-sm flex items-center justify-center h-full">
                            {`${currentDate.toLocaleDateString("en-US", {
                              weekday: "short",
                            })}, ${getOrdinalSuffix(day)}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
              )} */}
              {selectedMonth && (
                <div className="flex overflow-x-scroll gap-2">
                  {daysInMonth.map((day) => {
                    const currentDate = new Date(
                      currentYear,
                      months.indexOf(selectedMonth),
                      day
                    );
                    const isPastDay =
                      currentDate <
                      new Date(currentYear, currentMonthIndex, currentDay);

                    return (
                      <div
                        key={day}
                        className={`border h-[60px] rounded-md mb-3 mt-2 text-sm ${
                          isPastDay ? "hidden" : "block"
                        } ${
                          day === selectedDay
                            ? "bg-brand cursor-default text-white"
                            : "bg-white cursor-pointer"
                        }`}
                        onClick={() => setSelectedDay(day)}
                      >
                        <div className="w-[80px] flex items-center justify-center h-full">
                          {`${currentDate.toLocaleDateString("en-US", {
                            weekday: "short",
                          })}, ${getOrdinalSuffix(day)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="hidden">{selectedMonth}{selectedDay}</p>
            </div>
            <div className="px-6">
              <p className="font-semibold mb-2 text-[15px]">Arrival time:</p>
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                {timeArray.map((time, index) => (
                  <div
                    key={index}
                    className={`border text-sm text-center py-4 rounded-md ${
                      selectedTime === time
                        ? "bg-brand text-white cursor-default"
                        : "bg-white cursor-pointer"
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </div>
                ))}
              </div>
              <p className="mt-2 hidden">Selected Time: {selectedTime}</p>
            </div>
            <div className="px-6">
              <p className="font-semibold mb-2 text-[15px]">Select Service type:</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div
                  className={`py-4 rounded-md text-center cursor-pointer ${
                    selectedOption === "visitBarber" ? "bg-brand text-white" : "border"
                  }`}
                  onClick={() => handleOptionChange("visitBarber")}
                >
                  Visit the stylist
                </div>
                <div
                  className={`py-4 rounded-md text-center cursor-pointer ${
                    selectedOption === "homeService" ? "bg-brand text-white" : "border"
                  }`}
                  onClick={() => handleOptionChange("homeService")}
                >
                  Home service
                </div>
                <p className="hidden">Selected Option: {selectedOption}</p>
              </div>
            </div>
            <div className="px-6">
              <p className="font-semibold mb-2 text-[15px]">Additional information</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={"Number of people:"} value={numberOfPeople} type={"number"} onChange={(e)=>setNumberOfPeople(e.target.value)}/>
                <Input label={"Tip stylist: "} type={"number"} value={tipAmount} placeholder={"Optional"} onChange={(e)=>setTipAmount(e.target.value)}/>
              </div>
            </div>
            </div>
            <div className="border-t sticky w-full bottom-0 bg-white flex justify-between items-center px-6 py-4">
             <div>
              <p className="text-sm text-slate-400">Total:</p>
              <p className="text-brand font-bold text-xl">${isNaN(totalPrice) ? 0 : totalPrice.toLocaleString()}</p>
              </div>
             <button className="text-sm bg-brand text-white rounded-md px-6 py-4">Book appointment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to generate days for a given month
const generateDaysInMonth = (year, monthIndex) => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => i + 1);
};

export default SelectService;
