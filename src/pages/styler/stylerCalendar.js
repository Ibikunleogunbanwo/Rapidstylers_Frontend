import { useEffect, useRef, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, showSuccessToastMessage } from "../../utils/constant";
import { vendorCalendarToday, vendorTimeZoneLabelStrict } from "../../utils/vendorTimeZone";
import PendingAppointments from "./stylerComponents/pendingAppointments";

const STATUS_META = {
  "1": { label: "Pending", chip: "bg-amber-100 text-amber-800 border-amber-200" },
  "3": { label: "Accepted", chip: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  "0": { label: "Completed", chip: "bg-blue-100 text-blue-800 border-blue-200" },
  "2": { label: "Rejected", chip: "bg-red-100 text-red-800 border-red-200" },
  "4": { label: "Cancelled", chip: "bg-gray-100 text-gray-600 border-gray-200" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// appointmentDate arrives as YYYY-MM-DD (see selectService booking payload).
const dayOf = (dateStr) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr || "");
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
};

const StylerCalendar = () => {
  document.title = "Calendar | RapidStylers";
  const [appointments, setAppointments] = useState([]);
  const calendarZoneInitialized = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(null); // "YYYY-MM-DD"
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadAppointments = async () => {
    setLoadError("");
    setLoading(true);
    try {
      const res = await APIService.stylerAppointments();
      const rows = res.data?.data || [];
      setAppointments(rows);
      const professional = rows.find((row) => row.stylerData?.timeZone || row.stylerData?.province)?.stylerData;
      if (professional && !calendarZoneInitialized.current) {
        const today = vendorCalendarToday(professional);
        if (today) setCursor({ year: today.year, month: today.month });
        calendarZoneInitialized.current = true;
      }
    } catch (error) {
      setLoadError("Could not load your appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!getAuthToken()) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-gray-500">
        Please sign in to view your calendar.
      </div>
    );
  }

  const runAction = async (appointmentId, action, note = "") => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (action === "accept") {
        await APIService.acceptAppointment(appointmentId, note);
        showSuccessToastMessage("Appointment confirmed");
      } else if (action === "decline") {
        await APIService.declineAppointment(appointmentId, note);
        showSuccessToastMessage("Appointment rejected");
      } else if (action === "complete") {
        await APIService.completeAppointment(appointmentId);
        showSuccessToastMessage("Appointment marked as completed");
      }
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setActionLoading(false);
    }
  };

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const professional = appointments.find((row) => row.stylerData?.timeZone || row.stylerData?.province)?.stylerData;
  const localNow = new Date();
  const today = professional ? vendorCalendarToday(professional) : null;
  const calendarToday = today || { year: localNow.getFullYear(), month: localNow.getMonth(), day: localNow.getDate() };
  const todayKey = `${calendarToday.year}-${String(calendarToday.month + 1).padStart(2, "0")}-${String(calendarToday.day).padStart(2, "0")}`;

  const byDay = {};
  appointments.forEach((a) => {
    const key = dayOf(a.appointmentDate);
    if (!key) return;
    const [y, m] = key.split("-").map(Number);
    if (y === cursor.year && m - 1 === cursor.month) {
      (byDay[key] = byDay[key] || []).push(a);
    }
  });
  Object.keys(byDay).forEach((k) =>
    byDay[k].sort((a, b) => (a.arrivalTime || "").localeCompare(b.arrivalTime || ""))
  );

  const dayAppointments = selectedDay ? byDay[selectedDay] || [] : [];
  const selectedService = (a) => a.subServiceData?.name || "Service";
  const selectedClient = (a) =>
    [a.userData?.firstname, a.userData?.lastname].filter(Boolean).join(" ") ||
    a.userData?.emailAddress ||
    "Client";

  const shiftMonth = (delta) => {
    setCursor((c) => {
      const month = c.month + delta;
      if (month < 0) return { year: c.year - 1, month: 11 };
      if (month > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month };
    });
    setSelectedDay(null);
  };

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ blank: true });
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, key, items: byDay[key] || [] });
  }
  while (cells.length % 7 !== 0) cells.push({ blank: true });

  return (
    <div className="grid gap-6">
      <div className="min-w-0 bg-white rounded-lg border border-black/10 p-4 sm:p-6">
        <div className="min-w-0 flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <p className="text-[15px] font-medium text-onSurface">Calendar</p>
            <p className="text-sm text-gray-400">
              Your appointments at a glance. Click a day for details.
            </p>
          </div>
          {/* One row that fits a 360px phone: no wrapping "‹ Prev", Today always visible. */}
          <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-start sm:gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:border-brand hover:text-brand"
            >
              ‹<span className="hidden sm:inline"> Prev</span>
            </button>
            <span aria-live="polite" className="flex-1 sm:flex-none whitespace-nowrap text-sm font-bold text-gray-800 sm:min-w-[170px] text-center">
              {MONTHS[cursor.month]} {cursor.year}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:border-brand hover:text-brand"
            >
              <span className="hidden sm:inline">Next </span>›
            </button>
            <button
              type="button"
              onClick={() => {
                setCursor({ year: calendarToday.year, month: calendarToday.month });
                setSelectedDay(null);
              }}
              className="whitespace-nowrap px-2.5 sm:px-3 py-1.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:border-brand hover:text-brand"
            >
              Today
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-10 text-center">
            Loading appointments…
          </p>
        ) : loadError ? (<div role="alert" className="p-4 text-sm text-red-700">{loadError} <button type="button" onClick={loadAppointments}>Retry</button></div>) : (
          <>
            {/* Weekday header */}
            {/* minmax(0,1fr) columns: a long service chip can no longer widen a
                column and push Saturday off a phone screen. */}
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] border-b border-gray-100 pb-2 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[10px] sm:text-xs font-semibold text-gray-400 uppercase">
                  {w}
                </div>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-0.5 sm:gap-1.5">
              {cells.map((cell, idx) =>
                cell.blank ? (
                  <div key={`b${idx}`} className="min-h-[56px] sm:min-h-[92px] rounded-lg bg-gray-50/60" />
                ) : (
                  <button
                    type="button"
                    key={cell.key}
                    aria-label={cell.key}
                    aria-current={cell.key === todayKey ? "date" : undefined}
                    onClick={() => setSelectedDay(selectedDay === cell.key ? null : cell.key)}
                    className={`min-w-0 min-h-[56px] sm:min-h-[92px] overflow-hidden rounded-md sm:rounded-lg border p-1 sm:p-1.5 text-left align-top transition-colors ${
                      selectedDay === cell.key
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
                        : cell.key === todayKey
                        ? "border-brand/50 bg-brand/5"
                        : "border-gray-100 hover:border-brand/40 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          cell.key === todayKey ? "text-brand" : "text-gray-600"
                        }`}
                      >
                        {cell.day}
                      </span>
                      {cell.items.length > 0 && (
                        <span className="text-[10px] font-bold text-gray-400">
                          {cell.items.length}
                        </span>
                      )}
                    </div>
                    {/* Phones: one dot per appointment; the day panel below has the details. */}
                    {cell.items.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                        {cell.items.slice(0, 4).map((a) => (
                          <span key={a.appointmentId} className={`h-1.5 w-1.5 rounded-full border ${(STATUS_META[a.statusCode] || STATUS_META["1"]).chip}`} />
                        ))}
                      </div>
                    )}
                    <div className="mt-1 hidden sm:grid gap-1">
                      {cell.items.slice(0, 3).map((a) => {
                        const meta = STATUS_META[a.statusCode] || STATUS_META["1"];
                        return (
                          <span
                            key={a.appointmentId}
                            className={`block truncate rounded px-1 py-0.5 text-[10px] font-semibold border ${meta.chip}`}
                            title={`${selectedService(a)} · ${a.arrivalTime || ""} · ${meta.label}`}
                          >
                            {a.arrivalTime || "-"} {selectedService(a)}
                          </span>
                        );
                      })}
                      {cell.items.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-semibold">
                          +{cell.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Day details panel */}
      {selectedDay && (
        <div className="min-w-0 bg-white rounded-lg border border-black/10 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-gray-900">
              {new Date(selectedDay + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <span className="text-sm text-gray-400">
              {dayAppointments.length} appointment{dayAppointments.length === 1 ? "" : "s"}
            </span>
          </div>
          {dayAppointments.length === 0 ? (
            <p className="text-sm text-gray-500">No appointments on this day.</p>
          ) : (
            <div className="grid gap-3">
              {dayAppointments.map((a) => {
                const meta = STATUS_META[a.statusCode] || STATUS_META["1"];
                return (
                  <div
                    key={a.appointmentId}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3 hover:border-brand/40 cursor-pointer"
                    onClick={() => setSelectedAppointment(a)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">                            {a.arrivalTime ? `${a.arrivalTime} | ` : ""}
                        {selectedService(a)}
                      </p>
                      {(() => {
                        const zone = vendorTimeZoneLabelStrict({ timeZone: a.stylerData?.timeZone, province: a.stylerData?.province });
                        return zone ? <p className="text-xs text-gray-400">Times shown in {zone}</p> : null;
                      })()}
                      <p className="text-xs text-gray-500 truncate">
                        {selectedClient(a)} · {a.price || "-"}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold border ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedAppointment && (
        <PendingAppointments
          appointment={selectedAppointment}
          onclose={() => setSelectedAppointment(null)}
          actionLoading={actionLoading}
          onAccept={(note) => runAction(selectedAppointment.appointmentId, "accept", note)}
          onDecline={(note) => runAction(selectedAppointment.appointmentId, "decline", note)}
          onComplete={() => runAction(selectedAppointment.appointmentId, "complete")}
        />
      )}
    </div>
  );
};

export default StylerCalendar;
