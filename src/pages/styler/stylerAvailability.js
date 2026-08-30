import { useEffect, useState } from "react";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";

// Display order Monday-first, stored as JS getDay() numbers (0 = Sunday).
const DAYS = [
  { key: 1, label: "Monday" },
  { key: 2, label: "Tuesday" },
  { key: 3, label: "Wednesday" },
  { key: 4, label: "Thursday" },
  { key: 5, label: "Friday" },
  { key: 6, label: "Saturday" },
  { key: 0, label: "Sunday" },
];

const REASONS = ["Vacation", "Sick day", "Personal", "Holiday", "Training", "Other"];

const StylerAvailability = () => {
  document.title = "Availability | RapidStylers";
  // Weekly hours
  const [slots, setSlots] = useState(() =>
    DAYS.map((d) => ({ dayOfWeek: String(d.key), label: d.label, enabled: false, startTime: "09:00", endTime: "17:00" }))
  );
  // Date exceptions (vacation, sick day, etc.)
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // Exception form
  const [exceptionDate, setExceptionDate] = useState("");
  const [exceptionReason, setExceptionReason] = useState("Vacation");
  const [exceptionLoading, setExceptionLoading] = useState(false);
  // Home-visit travel settings
  const [includedTravelKm, setIncludedTravelKm] = useState("15");
  const [baseTravelFee, setBaseTravelFee] = useState("0.00");
  const [travelSaving, setTravelSaving] = useState(false);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const [slotsRes, exceptionsRes, travelRes] = await Promise.all([
        APIService.stylerAvailability(),
        APIService.stylerAvailabilityExceptions(),
        APIService.stylerTravelSettings(),
      ]);
      const existing = slotsRes.data?.data || [];
      setSlots((prev) =>
        prev.map((slot) => {
          const match = existing.find((e) => String(e.dayOfWeek) === slot.dayOfWeek);
          return match
            ? { ...slot, enabled: true, startTime: match.startTime, endTime: match.endTime }
            : slot;
        })
      );
      setExceptions(exceptionsRes.data?.data || []);
      const travel = travelRes.data?.data || {};
      setIncludedTravelKm(String(travel.includedTravelKm ?? 15));
      setBaseTravelFee(travel.baseTravelFee ?? "0.00");
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!getAuthToken()) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-gray-500">
        Please sign in to manage your availability.
      </div>
    );
  }

  const updateSlot = (index, patch) => {
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    const enabled = slots.filter((s) => s.enabled);
    for (const slot of enabled) {
      if (slot.startTime >= slot.endTime) {
        showErrorToastMessage("End time must be after start time for every working day");
        return;
      }
    }
    setSaveError("");
    setSaving(true);
    try {
      const payload = enabled.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));
      const res = await APIService.updateStylerAvailability(payload);
      showSuccessToastMessage(res.data?.message || "Availability updated");
    } catch (error) {
      setSaveError(error?.response?.data?.message || error?.message || "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const addException = async () => {
    if (!exceptionDate) {
      showErrorToastMessage("Please select a date");
      return;
    }
    setExceptionLoading(true);
    try {
      const res = await APIService.addAvailabilityException({ blockedDate: exceptionDate, reason: exceptionReason });
      setExceptions(res.data?.data || []);
      setExceptionDate("");
      showSuccessToastMessage("Date marked as unavailable");
    } catch (error) {
      // Error toasts are handled inside APIService.
    } finally {
      setExceptionLoading(false);
    }
  };

  const removeException = async (id) => {
    try {
      const res = await APIService.deleteAvailabilityException(id);
      setExceptions(res.data?.data || []);
      showSuccessToastMessage("Date restored to available");
    } catch (error) {
      // Error toasts are handled inside APIService.
    }
  };

  const handleTravelSave = async () => {
    const km = Number(includedTravelKm);
    const fee = Number(baseTravelFee);
    if (Number.isNaN(km) || km < 0) {
      showErrorToastMessage("Included travel distance must be 0 or more");
      return;
    }
    if (Number.isNaN(fee) || fee < 0) {
      showErrorToastMessage("Home visit fee must be 0 or more");
      return;
    }
    setTravelSaving(true);
    try {
      const res = await APIService.updateStylerTravelSettings(km, baseTravelFee);
      showSuccessToastMessage(res.data?.message || "Home visit settings updated");
    } catch (error) {
      showErrorToastMessage(error?.response?.data?.message || error?.message || "Failed to save home visit settings");
    } finally {
      setTravelSaving(false);
    }
  };

  const enabledCount = slots.filter((s) => s.enabled).length;

  // Today's date for the date picker minimum
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="grid gap-6">
      {/* Weekly hours */}
      <div className="bg-white rounded-2xl border border-[#1d1d1d0a] shadow-sm p-6">
        <div className="mb-5">
          <p className="text-lg font-bold">Working Hours</p>
          <p className="text-sm text-gray-400">
            Set your weekly working hours. Customers can only pick times inside these windows.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-10 text-center">Loading availability…</p>
        ) : (
          <div className="grid gap-3">
            {slots.map((slot, index) => (
              <div
                key={slot.dayOfWeek}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 ${
                  slot.enabled ? "border-brand/40 bg-brand/[0.03]" : "border-gray-100 bg-gray-50/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => updateSlot(index, { enabled: !slot.enabled })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      slot.enabled ? "bg-brand" : "bg-gray-300"
                    }`}
                    aria-label={`Toggle ${slot.label}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        slot.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${slot.enabled ? "text-gray-900" : "text-gray-400"}`}>
                    {slot.label}
                  </span>
                </div>
                {slot.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
                    />
                    <span className="text-sm text-gray-400">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                      className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">Unavailable</span>
                )}
              </div>
            ))}
          </div>
        )}

        {saveError && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span>{saveError}</span>
          </div>
        )}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-500">
            {enabledCount === 0
              ? "No working hours set. Customers cannot book a time."
              : `${enabledCount} working day${enabledCount === 1 ? "" : "s"} set.`}
          </p>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save hours"}
          </button>
        </div>
      </div>

      {/* Home visits — flat travel fee */}
      <div className="bg-white rounded-2xl border border-[#1d1d1d0a] shadow-sm p-6">
        <div className="mb-5">
          <p className="text-lg font-bold">Home Visits</p>
          <p className="text-sm text-gray-400">
            Set a flat home-visit fee and your included free radius. Customers within the radius pay no travel fee; beyond it they pay the flat fee once. You stay free to accept or decline any booking based on how far it is.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Included free distance (km)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={includedTravelKm}
              onChange={(e) => setIncludedTravelKm(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Home visit fee ($, flat)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={baseTravelFee}
              onChange={(e) => setBaseTravelFee(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleTravelSave}
            disabled={travelSaving}
            className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {travelSaving ? "Saving…" : "Save home visit settings"}
          </button>
        </div>
      </div>

      {/* Date exceptions */}
      <div className="bg-white rounded-2xl border border-[#1d1d1d0a] shadow-sm p-6">
        <div className="mb-5">
          <p className="text-lg font-bold">Exceptions</p>
          <p className="text-sm text-gray-400">
            Mark specific dates as unavailable (vacation, sick day, personal leave). Overrides your weekly hours.
          </p>
        </div>

        {/* Add exception form */}
        <div className="flex flex-wrap items-end gap-3 mb-5">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Date</label>
            <input
              type="date"
              min={today}
              value={exceptionDate}
              onChange={(e) => setExceptionDate(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1">Reason</label>
            <select
              value={exceptionReason}
              onChange={(e) => setExceptionReason(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-brand focus:outline-none"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            onClick={addException}
            disabled={exceptionLoading}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {exceptionLoading ? "Adding…" : "Block date"}
          </button>
        </div>

        {/* Exception list */}
        {exceptions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No date exceptions. All available dates follow your weekly hours.</p>
        ) : (
          <div className="grid gap-2">
            {exceptions.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 bg-gray-50/50"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {new Date(ex.blockedDate + "T00:00:00").toLocaleDateString(undefined, {
                      weekday: "long", month: "long", day: "numeric", year: "numeric",
                    })}
                  </p>
                  {ex.reason && (
                    <p className="text-xs text-gray-500 mt-0.5">{ex.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => removeException(ex.id)}
                  className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StylerAvailability;
