import React from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ordinal = (n) => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${{ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th"}`;
};

/**
 * The booking dialog's date picker: the whole month as a grid, Sunday first,
 * so a customer sees how the month falls at a glance. Past days stay visible
 * but greyed out and unclickable; days the professional does not work, or has
 * blocked off, are greyed (blocked days in red) with the reason on hover.
 *
 * "Past" and "today" are judged on the professional's calendar, which the
 * caller passes in, so a visitor in another time zone books by their dates.
 */
const BookingMonthCalendar = ({
  year,
  monthIndex,
  today,            // { year, month, day } on the professional's calendar
  selectedDay,
  onSelectDay,
  isWeekdayOpen,    // (weekday 0-6) => boolean
  isDateBlocked,    // ("YYYY-MM-DD") => boolean
}) => {
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const todayStart = new Date(today.year, today.month, today.day);
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: lastDay }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-3" data-testid="booking-month-calendar">
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-gray-400 mb-1">
        {WEEKDAYS.map((name) => <span key={name} aria-hidden="true">{name}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Choose a date">
        {cells.map((day, index) => {
          if (!day) return <span key={`blank-${index}`} aria-hidden="true" />;
          const date = new Date(year, monthIndex, day);
          const weekday = date.getDay();
          const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast = date < todayStart;
          const isToday = date.getTime() === todayStart.getTime();
          const blocked = !isPast && isDateBlocked(dateKey);
          const closed = !isPast && !blocked && !isWeekdayOpen(weekday);
          const disabled = isPast || blocked || closed;
          const selected = day === selectedDay && !disabled;
          const reason = isPast ? "This date has passed"
            : blocked ? "The professional is unavailable on this date"
            : closed ? "The professional does not work this day"
            : "";
          const label = `${WEEKDAYS[weekday]}, ${ordinal(day)}${isToday ? " · today" : ""}`;
          const tone = selected
            ? "bg-brand text-white border-brand"
            : isPast
            ? "bg-gray-50 text-gray-300 border-transparent line-through"
            : blocked
            ? "bg-red-50 text-red-300 border-transparent"
            : closed
            ? "bg-gray-50 text-gray-300 border-transparent"
            : "bg-white text-onSurface border-gray-200 hover:border-brand";
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={label}
              title={reason || label}
              onClick={() => onSelectDay(day)}
              className={`relative h-11 rounded-md border text-sm transition-colors disabled:cursor-not-allowed ${tone} ${isToday && !selected ? "ring-1 ring-brand" : ""}`}
            >
              {day}
              {isToday && (
                <span className={`absolute inset-x-0 bottom-0.5 text-[9px] leading-none ${selected ? "text-white" : "text-brand"}`}>today</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BookingMonthCalendar;
