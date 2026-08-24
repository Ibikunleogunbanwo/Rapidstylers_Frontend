import close from "../assets/svg-icons/closeBlack.svg";
import React, { useEffect, useState } from "react";
import Input from "../components/input";
import { APIService } from "../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../utils/constant";
import { useNavigate } from "react-router-dom";
import { useUserLocation } from "../context/LocationContext";

const SelectService = ({serviceName, servicePrice, durationMinutes = 60, stylerId, subServiceId, stylerLatitude, stylerLongitude}) => {
  const [bookAppointmentForm, setBookAppointmentForm] = useState(false);
  const navigate = useNavigate();
  const { location: userLocation } = useUserLocation() || {};
  // Weekly availability from single_styler: [{dayOfWeek 0-6, startTime, endTime}] or
  // null while loading (nothing blocked) / [] when the stylist hasn't set hours.
  const [availability, setAvailability] = useState(null);
  // Active bookings [{appointmentDate, arrivalTime, durationMinutes, status}] —
  // their service windows are blocked until cancelled or rejected.
  const [bookedSlots, setBookedSlots] = useState([]);

  const toMinutes = (value) => {
    const m = /^(\d{1,2}):(\d{2})\s*(am|pm)?$/i.exec((value || "").trim());
    if (!m) return NaN;
    let hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    const meridiem = (m[3] || "").toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    return hour * 60 + minute;
  };

  const format12 = (value) => {
    const [h, m] = (value || "").split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return value;
    const meridiem = h >= 12 ? "pm" : "am";
    const hour = h % 12 === 0 ? 12 : h % 12;
    return `${hour}:${String(m).padStart(2, "0")} ${meridiem}`;
  };

  const isDayAvailable = (weekday) => {
    if (availability === null) return true; // still loading — don't block the picker
    return (availability || []).some((s) => Number(s.dayOfWeek) === weekday);
  };

  const isTimeAvailable = (timeLabel) => {
    if (availability === null) return true;
    const slots = availability || [];
    if (slots.length === 0) return false;
    if (!selectedDay) return true; // no date picked yet — don't block the grid
    const weekday = new Date(currentYear, months.indexOf(selectedMonth), selectedDay).getDay();
    const daySlots = slots.filter((s) => Number(s.dayOfWeek) === weekday);
    if (daySlots.length === 0) return false;
    const minutes = toMinutes(timeLabel);
    return daySlots.some((s) => {
      const start = toMinutes(s.startTime);
      const end = toMinutes(s.endTime);
      return minutes >= start && minutes + Number(durationMinutes || 60) <= end;
    });
  };

  const windowsFor = (weekday) =>
    (availability || []).filter((s) => Number(s.dayOfWeek) === weekday);

  // Load the stylist's weekly hours, booked windows, and exceptions when the booking form opens.
  const [exceptions, setExceptions] = useState([]);
  const loadAvailability = async () => {
    try {
      const res = await APIService.singleStylerData(stylerId);
      setAvailability(res.data?.data?.availability || []);
      setBookedSlots(res.data?.data?.bookedSlots || []);
      setExceptions(res.data?.data?.exceptions || []);
    } catch (error) {
      setAvailability([]);
    }
  };

  // "YYYY-MM-DD" for a day of the currently selected month (used for slot lookups).
  const dateKeyFor = (day) =>
    day
      ? `${currentYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : "";

  // True when the date is blocked by a vacation/sick exception.
  const isDateException = (dateStr) =>
    dateStr ? exceptions.some((e) => e.blockedDate === dateStr) : false;

  // True when a booking overlaps the selected service window at timeLabel.
  const isTimeBlocked = (dateStr, timeLabel) => {
    if (!dateStr || bookedSlots.length === 0) return false;
    const t = toMinutes(timeLabel);
    if (isNaN(t)) return false;
    const active = bookedSlots.filter(
      (s) => s.appointmentDate === dateStr && !["2", "4"].includes(String(s.status))
    );
    return active.some((s) => {
      const start = toMinutes(s.arrivalTime);
      if (isNaN(start)) return false;
      const bookedDuration = Number(s.durationMinutes || 60);
      const requestedDuration = Number(durationMinutes || 60);
      return t < start + bookedDuration && t + requestedDuration > start;
    });
  };

  // Function to toggle booking form
  const toggleBookingForm = () => {
    const next = !bookAppointmentForm;
    setBookAppointmentForm(next);
    if (next) loadAvailability();
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
  const timeArray = Array.from({ length: 45 }, (_, index) => {
    const minutes = (9 * 60) + index * 15;
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "am" : "pm"}`;
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
  const [bookingEstimate, setBookingEstimate] = useState(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const travelDistanceKm = (() => {
    const userLat = Number(userLocation?.latitude);
    const userLng = Number(userLocation?.longitude);
    const stylerLat = Number(stylerLatitude);
    const stylerLng = Number(stylerLongitude);
    if ([userLat, userLng, stylerLat, stylerLng].some((value) => Number.isNaN(value))) {
      return null;
    }
    const toRad = (value) => (value * Math.PI) / 180;
    const earthKm = 6371;
    const dLat = toRad(stylerLat - userLat);
    const dLng = toRad(stylerLng - userLng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userLat)) *
        Math.cos(toRad(stylerLat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    return Math.round(earthKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
  })();

  useEffect(() => {
    if (!bookAppointmentForm) return;
    if (selectedOption === "homeService" && travelDistanceKm === null) {
      setBookingEstimate(null);
      return;
    }
    let mounted = true;
    setEstimateLoading(true);
    APIService.estimateBooking({
      stylerId,
      subServiceId,
      serviceTime: selectedOption,
      noOfPeople: String(numberOfPeople),
      travelDistanceKm: selectedOption === "homeService" ? travelDistanceKm : 0,
    })
      .then((res) => {
        if (mounted) setBookingEstimate(res.data?.data || null);
      })
      .catch(() => {
        if (mounted) setBookingEstimate(null);
      })
      .finally(() => {
        if (mounted) setEstimateLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [bookAppointmentForm, selectedOption, numberOfPeople, stylerId, subServiceId, travelDistanceKm]);

  // Submits the booking request to the marketplace endpoint. The backend
  // re-validates the stylist/service and derives the price server-side.
  const handleBookAppointment = async () => {
    if (!getAuthToken()) {
      showErrorToastMessage("Please sign in to book an appointment");
      navigate("/login");
      return;
    }
    if (!selectedDay || !selectedTime) {
      showErrorToastMessage("Please select a date and arrival time");
      return;
    }
    if (selectedOption === "homeService" && travelDistanceKm === null) {
      showErrorToastMessage("We could not calculate the travel distance for home service. Please update your location and try again.");
      return;
    }
    setBookingError("");
    setIsBooking(true);
    try {
      const appointmentDate = `${currentYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
      await APIService.bookAppointment({
        stylerId,
        subServiceId,
        appointmentDate,
        arrivalTime: selectedTime,
        serviceTime: selectedOption,
        noOfPeople: String(numberOfPeople),
        travelDistanceKm: selectedOption === "homeService" ? travelDistanceKm : 0,
      });
      showSuccessToastMessage("Booking request sent. The stylist will confirm shortly.");
      closeBookingForm();
    } catch (error) {
      setBookingError(error?.response?.data?.message || error?.message || "Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="">
      <div className="grid gap-3 mt-3">
        <div className="grid gap-3 pb-4 border-b">
          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-8 md:col-span-10 text-black/50">
              <div>{serviceName}</div>
              <div className="text-xs text-gray-400 mt-1">{durationMinutes} min appointment</div>
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
                    const dayOpen = isDayAvailable(currentDate.getDay());
                    const dateKey = `${currentYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const exceptionBlocked = isDateException(dateKey);
                    const fullyBlocked = !dayOpen || exceptionBlocked;

                    return (
                      <div
                        key={day}
                        className={`border h-[60px] rounded-md mb-3 mt-2 text-sm ${
                          isPastDay ? "hidden" : "block"
                        } ${
                          day === selectedDay
                            ? "bg-brand cursor-default text-white"
                            : exceptionBlocked
                            ? "bg-red-50 text-red-300 cursor-not-allowed"
                            : dayOpen
                            ? "bg-white cursor-pointer"
                            : "bg-gray-50 text-gray-300 cursor-not-allowed"
                        }`}
                        onClick={() => !fullyBlocked && setSelectedDay(day)}
                        title={exceptionBlocked ? "Stylist is unavailable on this date" : dayOpen ? "" : "Stylist is not available this day"}
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
              <p className="text-xs text-gray-500 mb-2">This service takes {durationMinutes} minutes.</p>
              {availability !== null && availability.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
                  This stylist hasn't set their availability yet. You can still request a time and they will confirm.
                </p>
              )}
              {selectedDay && windowsFor(new Date(currentYear, months.indexOf(selectedMonth), selectedDay).getDay()).length > 0 && (
                <p className="text-xs text-gray-500 mb-2">
                  Working hours:{" "}
                  {windowsFor(new Date(currentYear, months.indexOf(selectedMonth), selectedDay).getDay())
                    .map((w) => `${format12(w.startTime)} – ${format12(w.endTime)}`)
                    .join(", ")}
                </p>
              )}
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                {timeArray.map((time, index) => {
                  const timeOpen = isTimeAvailable(time);
                  const blocked = isTimeBlocked(dateKeyFor(selectedDay), time);
                  const selectable = timeOpen && !blocked;
                  return (
                    <div
                      key={index}
                      className={`border text-sm text-center py-4 rounded-md ${
                        selectedTime === time
                          ? "bg-brand text-white cursor-default"
                          : selectable
                          ? "bg-white cursor-pointer"
                          : blocked
                          ? "bg-red-50 text-red-300 cursor-not-allowed"
                          : "bg-gray-50 text-gray-300 cursor-not-allowed"
                      }`}
                      onClick={() => selectable && setSelectedTime(time)}
                      title={blocked ? "Already booked" : timeOpen ? "" : "Outside the stylist's working hours"}
                    >
                      {time}
                    </div>
                  );
                })}
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
              </div>
            </div>
            <div className="px-6">
              <div className="rounded-md border bg-slate-50 p-4 text-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold">Booking estimate</p>
                  {estimateLoading && <span className="text-xs text-gray-400">Updating...</span>}
                </div>
                {selectedOption === "homeService" && travelDistanceKm === null ? (
                  <p className="text-amber-600">
                    Travel distance is unavailable. Update your location before requesting home service.
                  </p>
                ) : bookingEstimate ? (
                  <div className="grid gap-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Service</span>
                      <span>${bookingEstimate.servicePrice}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">
                        Travel fee
                        {selectedOption === "homeService" && (
                          <span className="block text-xs">
                            First {bookingEstimate.includedTravelKm}km included; {bookingEstimate.billableTravelKm}km billable
                          </span>
                        )}
                      </span>
                      <span>${bookingEstimate.travelFee}</span>
                    </div>
                    {selectedOption === "homeService" && (
                      <div className="flex justify-between gap-4 text-xs text-gray-500">
                        <span>Estimated distance</span>
                        <span>{bookingEstimate.travelDistanceKm}km</span>
                      </div>
                    )}
                    <div className="mt-2 flex justify-between gap-4 border-t pt-3 font-bold text-brand">
                      <span>Total estimate</span>
                      <span>${bookingEstimate.totalPrice}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Select service options to calculate the booking total.</p>
                )}
              </div>
            </div>
            </div>
            <div className="border-t sticky w-full bottom-0 bg-white flex justify-between items-center px-6 py-4">
             <div>
              <p className="text-sm text-slate-400">Total estimate:</p>
              <p className="text-brand font-bold text-xl">${bookingEstimate?.totalPrice || servicePrice}</p>
              </div>
             <div className="flex-1">
                {bookingError && (
                  <div className="mb-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-start gap-2">
                    <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span>{bookingError}</span>
                  </div>
                )}
              </div>
             <button
                className="text-sm bg-brand text-white rounded-md px-6 py-4"
                onClick={handleBookAppointment}
                disabled={isBooking}
              >
                {isBooking ? "Booking..." : "Book appointment"}
              </button>
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
