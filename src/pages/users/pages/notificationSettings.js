import { useEffect, useState } from "react";
import Back from "../../../components/goBack";
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";

const NotificationSettings = ({ setPageTitle }) => {
  const [preferences, setPreferences] = useState({ availability: true, price: true, verification: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPageTitle("Account Settings");
    document.title = "Notification settings | RapidStylers";
    if (!getAuthToken()) { setLoading(false); return; }
    APIService.getNotificationPreferences()
      .then((response) => setPreferences({ ...preferences, ...(response.data?.data || {}) }))
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = async (key, value) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSaving(true);
    try {
      await APIService.updateNotificationPreferences(next);
      showSuccessToastMessage("Notification preferences updated");
    } catch (error) {
      setPreferences(preferences);
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
    <div className="rounded-lg border bg-white">
      <div className="flex items-center gap-1 border-b bg-[#1d1d1d08] p-4 text-[15px] font-bold"><Back /><span>Notification settings</span></div>
      <div className="grid gap-4 p-4">
        <div><p className="font-semibold">Saved professional updates</p><p className="mt-1 text-sm text-gray-500">Choose which changes should also be sent by email. In-app notifications remain available in your inbox.</p></div>
        {!getAuthToken() ? <p className="text-sm text-gray-500">Please sign in to manage notification preferences.</p> : loading ? <p className="text-sm text-gray-500">Loading preferences...</p> : options.map(([key, label]) => (
          <label key={key} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <input type="checkbox" checked={Boolean(preferences[key])} disabled={saving} onChange={(event) => update(key, event.target.checked)} className="mt-1 h-4 w-4 accent-brand" />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
