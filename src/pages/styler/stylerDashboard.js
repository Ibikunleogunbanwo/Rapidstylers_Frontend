// src/components/CalendarDashboard.js

import React, { useState } from 'react';
import { format, addDays, isToday } from 'date-fns';
import calendar from "../../assets/svg-icons/calendar.svg";
import arrow from "../../assets/svg-icons/darkArrow.svg";
import AppointmentDetails from './stylerComponents/appointmentDetails';

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

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const openDetails = () => {
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
  };

  return (
    <div className='border rounded-md relative'>
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
