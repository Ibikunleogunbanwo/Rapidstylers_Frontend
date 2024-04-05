import React, { useState } from "react";

const MonthDropdown = () => {
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
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = number % 100;
    return number + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const [selectedDay, setSelectedDay] = useState(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();

  const [selectedMonth, setSelectedMonth] = useState("");
  const [daysInMonth, setDaysInMonth] = useState([]);

  const handleMonthChange = (event) => {
    const selected = event.target.value;
    setSelectedMonth(selected);

    // Generate days for the selected month
    const days = Array.from(
      {
        length: new Date(
          currentYear,
          months.indexOf(selected) + 1,
          0
        ).getDate(),
      },
      (_, i) => i + 1
    );
    setDaysInMonth(days);

    // Set the default selected day to the current day when it's not already set
    if (selectedDay === null) {
      setSelectedDay(currentDay);
    } else {
      // Clear the selected day when a different month is selected
      setSelectedDay(null);
    }
  };

  return (
    <div>
      <label>Select Month:</label>
      <select onChange={handleMonthChange} value={selectedMonth}>
        <option value="" disabled>
          Select a month
        </option>
        {months.map((month, index) => (
          <option key={index} value={month}>
            {month}
          </option>
        ))}
      </select>

      {selectedMonth && (
        <div>
          <h2>
            Days in {selectedMonth} {currentYear}:
          </h2>
          <div className="flex overflow-x-scroll gap-4">
            {daysInMonth.map((day) => {
              const currentDate = new Date(
                currentYear,
                months.indexOf(selectedMonth),
                day
              );
              const isPastDay =
                currentDate < new Date(currentYear, currentMonth, currentDay);

              return (
                <div
                  key={day}
                  className={`border h-[80px] ${isPastDay ? "hidden" : "block"} ${
                    day === selectedDay
                      ? "bg-brand cursor-default"
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
        </div>
      )}
    </div>
  );
};

export default MonthDropdown;
