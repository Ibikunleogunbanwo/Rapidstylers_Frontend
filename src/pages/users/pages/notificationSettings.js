import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";

const NotificationSettings = ({ setPageTitle }) => {
  const [preferences, setPreferences] = useState({ availability: true, price: true, verification: true });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  // Shown beside the options: each change saves straight away, and this line
  // says so ("Saving..." -> "Saved", or the failure) instead of a toast alone.
  const [saveState, setSaveState] = useState("");

  const load = async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    try {
      const response = await APIService.getNotificationPreferences();
      const data = response.data?.data;
      if (!data || !["availability", "price", "verification"].every((key) => typeof data[key] === "boolean")) throw new Error("Invalid preferences");
      setPreferences(data);
    } catch (error) {
      setLoadError(true);
    } finally { setLoading(false); }
  };
  useEffect(() => {
    setPageTitle("Account Settings");
    document.title = "Notification settings | RapidStylers";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (key, value) => {
    if (loading || loadError || saving) return;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSaving(true);
    setSaveState("saving");
    try {
      await APIService.updateNotificationPreferences(next);
      setSaveState("saved");
      showSuccessToastMessage("Notification preferences saved");
    } catch (error) {
      setPreferences(preferences);
      setSaveState("failed");
      showErrorToastMessage("Unable to update notification preferences");
    } finally {
      setSaving(false);
    }
  };

  const options = [
    ["availability", "A saved professional changes working hours or blocks a date"],
    ["price", "A saved professional changes a service price"],
    ["verification", "A saved professional is approved, rejected, or suspended"],
  ];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-brand/5 to-white px-4 py-4 sm:px-5">
        <div className="flex items-center gap-2">
          <Back />
          <div>
            <h1 className="text-[15px] font-bold text-gray-900">Notification settings</h1>
            <p className="mt-0.5 text-xs text-gray-500">Choose the updates you want by email</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 p-4">
        <div><p className="font-semibold">Saved professional updates</p><p className="mt-1 text-sm text-gray-500">Choose which changes should also be sent by email. In-app notifications remain available in your inbox. Changes save as soon as you tick or untick a box.</p></div>
        {!getAuthToken() ? <p className="text-sm text-gray-500">Please sign in to manage notification preferences.</p> : loading ? <p className="text-sm text-gray-500">Loading preferences...</p> : loadError ? <div role="alert">Unable to load notification preferences. <button type="button" onClick={load}>Retry</button></div> : options.map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <input type="checkbox" checked={Boolean(preferences[key])} disabled={saving} onChange={(event) => update(key, event.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
        {getAuthToken() && !loading && !loadError && (
          <p role="status" aria-live="polite" className={`min-h-[20px] text-sm ${saveState === "failed" ? "text-red-600" : saveState === "saved" ? "text-emerald-700" : "text-gray-500"}`}>
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved. Your email preferences are up to date." : saveState === "failed" ? "Not saved. Please try again." : ""}
          </p>
        )}
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <p className="font-semibold text-gray-800">Booking emails</p>
          <p className="mt-1">Emails about your own appointments (request received, confirmed and cancelled) are always sent, so you never miss a change to a booking.</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
