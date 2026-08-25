// src/components/CalendarDashboard.js

import React, { useEffect, useState } from 'react';
import { format, addDays, isToday } from 'date-fns';
import calendar from "../../assets/svg-icons/calendar.svg";
import arrow from "../../assets/svg-icons/darkArrow.svg";
import AppointmentDetails from './stylerComponents/appointmentDetails';
import { APIService } from "../../hooks/remote/apiService";
import { humanizeConnectReason, showErrorToastMessage } from "../../utils/constant";

const timeSlots = {
  morning: [
    '6:00-7:00am',
    '7:00-8:00am',
    '8:00-9:00am',
    '9:00-10:00am',
    '10:00-11:00am',
    '11:00-12:00pm',
  ],
  afternoon: [
    '12:00-1:00pm',
    '1:00-2:00pm',
    '2:00-3:00pm',
    '3:00-4:00pm',
    '4:00-5:00pm',
  ],
  evening: [
    '5:00-6:00pm',
    '6:00-7:00pm',
    '7:00-8:00pm',
    '8:00-9:00pm',
  ],
};

const StylerDashboard = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const goToNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const goToPreviousDay = () => {
    if (!isToday(selectedDate)) {
      setSelectedDate(addDays(selectedDate, -1));
    }
  };

  // const showFullCalendar = () => {
  //   
  // };

  // Stripe Connect payouts — "Get paid" setup for the stylist.
  const [connectStatus, setConnectStatus] = useState(null);
  const [connectReason, setConnectReason] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    APIService.getStylerConnectStatus()
      .then((response) => {
        setConnectStatus(response.data?.data?.status || "NOT_STARTED");
        setConnectReason(response.data?.data?.disabledReason || null);
      })
      .catch(() => {
        setConnectStatus("NOT_STARTED");
        setConnectReason(null);
      });
  }, []);

  const startConnect = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      const dashboardUrl = `${window.location.origin}/styler-dashboard`;
      const { data } = await APIService.createStylerConnectAccount({
        returnUrl: `${dashboardUrl}?connect=done`,
        refreshUrl: dashboardUrl,
      });
      if (data?.statusCode !== "200") {
        // The backend answers HTTP 200 with the error in the body (no
        // exception thrown), so surface it explicitly instead of failing silent.
        showErrorToastMessage(data?.message || "Could not start Stripe Connect. Please try again.");
        return;
      }
      if (data?.data?.onboardingUrl) {
        window.location.href = data.data.onboardingUrl;
      } else if (data?.data?.status) {
        setConnectStatus(data.data.status);
      }
    } catch (error) {
      showErrorToastMessage(error?.response?.data?.message || "Could not start Stripe Connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const payoutBadge = connectStatus === "COMPLETE"
    ? { label: "Ready for payouts", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" }
    : connectStatus === "REJECTED"
      ? { label: "Needs attention", cls: "bg-red-50 text-red-700 border-red-200" }
      : connectStatus === "PENDING"
        ? { label: "Setup in progress", cls: "bg-amber-50 text-amber-700 border-amber-200" }
        : { label: "Not connected", cls: "bg-gray-50 text-gray-600 border-gray-200" };

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = () => {
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  return (
    <div className='border rounded-md relative'>
      <div className="border-b p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#fafaff]">
        <div>
          <p className="text-sm font-semibold">Get paid</p>
          <p className="text-xs text-black/50 mt-0.5">
            {connectStatus === "COMPLETE"
              ? "Payouts are enabled — your share of each completed appointment is paid to your connected Stripe account."
              : connectStatus === "REJECTED"
                ? "Stripe could not verify your payout account."
                : "Connect a Stripe account to receive payouts for completed appointments. Your ID and bank details are collected securely by Stripe."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium border rounded-full px-3 py-1 ${payoutBadge.cls}`}>{payoutBadge.label}</span>
          {connectStatus !== "COMPLETE" && (
            <button
              type="button"
              onClick={startConnect}
              disabled={connecting}
              className={`text-xs text-white rounded-md px-4 py-2 ${connectStatus === "REJECTED" ? "bg-red-600 hover:bg-red-700" : "bg-brand"}`}
            >
              {connecting ? "Opening Stripe..." : connectStatus === "PENDING" ? "Continue setup" : connectStatus === "REJECTED" ? "Reconnect" : "Connect to get paid"}
            </button>
          )}
        </div>
      </div>
      {connectStatus === "REJECTED" && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          <p className="font-semibold flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-600" aria-hidden="true"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
            Rejection reason: <span className="font-medium">{humanizeConnectReason(connectReason)}</span>
          </p>
          <p className="mt-0.5 text-red-700/80">Reconnect to re-enter your details — your earnings stay safe until it's sorted.</p>
        </div>
      )}
      <div className='border-b p-4 flex justify-between'>
        <div className='flex items-center gap-4 text-sm'>
          <div onClick={goToPreviousDay} disabled={isToday(selectedDate)} className={`border rounded-md p-2 ${isToday(selectedDate) ? "cursor-default" : "cursor-pointer"}`}>
            <img src={arrow} alt="" className={`h-4 rotate-180 ${isToday(selectedDate) ? "opacity-30" : "opacity-100"}`}/>
          </div>
            <div className='border rounded-md p-2 text-xs font-medium cursor-default'>
              {format(selectedDate, 'eee, MMMM d')}
              {/* add yyy to show the current yr */}
            </div>
          <div onClick={goToNextDay} className='border rounded-md p-2 cursor-pointer'>
            <img src={arrow} alt=""  className='h-4'/>
          </div>
        </div>
        <div className='border rounded-md p-2'>
          <img src={calendar} alt="" className='h-4'/>
        </div>
      </div>
      <div className='p-4 text-sm'>
        <p className='font-semibold'>Morning:</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
          {timeSlots.morning.map((slot, index) => (
            <div key={index} className='border p-4 rounded-md text-center text-xs cursor-pointer' onClick={openDetails}>{slot}</div>
          ))}
        </div>
        
        <p className='font-semibold mt-10'>Afternoon:</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
          {timeSlots.afternoon.map((slot, index) => (
            <div key={index} className='border p-4 rounded-md text-center text-xs cursor-pointer' onClick={openDetails}>{slot}</div>
          ))}
        </div>
        <p className='font-semibold mt-10'>Evening:</p>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
          {timeSlots.evening.map((slot, index) => (
            <div key={index} className='border p-4 rounded-md text-center text-xs cursor-pointer' onClick={openDetails}>{slot}</div>
          ))}
        </div>
      </div>
      {/* Appointment details */}
      {isDetailsOpen && <AppointmentDetails onclose={closeDetails} />}
    </div>
  );
};

export default StylerDashboard;
