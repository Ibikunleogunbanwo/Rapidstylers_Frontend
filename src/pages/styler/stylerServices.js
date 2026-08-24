import { useEffect, useState } from "react";
import close from "../../assets/svg-icons/closeBlack.svg";
import Input from "../../components/input";
import Buttons from "../../components/button";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../utils/constant";

const formatDuration = (minutes) => {
  const value = Number(minutes || 60);
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addServiceModal, setAddServiceModal] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadServices = async () => {
    const session = getAuthToken();
    if (!session) return;
    try {
      const response = await APIService.listSubServices("self");
      setServices(response.data?.data || []);
    } catch (error) {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const closeServiceModal = () => {
    setAddServiceModal(false);
    setEditingService(null);
    setName("");
    setPrice("");
    setDurationMinutes("60");
    setModalError("");
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setName(service.name || "");
    setPrice(String(service.price || "").replace("$", ""));
    setDurationMinutes(String(service.durationMinutes || 60));
    setAddServiceModal(true);
  };

  const addService = async () => {
    const duration = Number(durationMinutes);
    if (!name.trim() || !price.trim()) {
      showErrorToastMessage("Enter a service name and price");
      return;
    }
    if (!Number.isInteger(duration) || duration < 15 || duration > 480 || duration % 15 !== 0) {
      showErrorToastMessage("Duration must be in 15-minute increments between 15 and 480 minutes");
      return;
    }
    setModalError("");
    setSaving(true);
    try {
      if (editingService) {
        await APIService.updateSubService({
          id: editingService.id,
          name: name.trim(),
          price: price.trim(),
          durationMinutes: duration,
        });
        showSuccessToastMessage("Service updated");
      } else {
        await APIService.createSubService({
          name: name.trim(),
          price: price.trim(),
          durationMinutes: String(duration),
        });
        showSuccessToastMessage("Service added");
      }
      closeServiceModal();
      await loadServices();
    } catch (error) {
      setModalError(error?.response?.data?.message || error?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <div className="border-b p-4 font-medium text-sm flex gap-4 justify-between items-center">
        <span>My services</span>
        <button
          type="button"
          className="text-brand text-xs cursor-pointer"
          onClick={() => setAddServiceModal(true)}
        >
          + Add a new service
        </button>
      </div>
      <div className="overflow-x-auto m-2">
        <table className="w-full text-sm text-left bg-primary">
          <thead className="border-b border-lightPrimary">
            <tr>
              <th scope="col" className="px-4 py-4 whitespace-nowrap">No.</th>
              <th scope="col" className="px-4 py-4 whitespace-nowrap">Service name</th>
              <th scope="col" className="px-4 py-4 whitespace-nowrap">Amount</th>
              <th scope="col" className="px-4 py-4 whitespace-nowrap">Duration</th>
              <th scope="col" className="px-4 py-4 whitespace-nowrap">Status</th>
              <th scope="col" className="px-4 py-4 whitespace-nowrap">Action</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {loading ? (
              <tr><td className="px-4 py-6 text-gray-500" colSpan="6">Loading services...</td></tr>
            ) : services.length === 0 ? (
              <tr><td className="px-4 py-6 text-gray-500" colSpan="6">No services added yet.</td></tr>
            ) : services.map((service, index) => (
              <tr className="hover:bg-[#c4c4c424]" key={service.id || index}>
                <td className="text-start py-5 ps-4">{index + 1}</td>
                <td className="text-start py-5 ps-4 truncate max-w-48 md:max-w-80">{service.name}</td>
                <td className="text-start py-5 ps-4">${service.price}</td>
                <td className="text-start py-5 ps-4">{formatDuration(service.durationMinutes)}</td>
                <td className="text-start py-5 ps-4">{service.status || "Active"}</td>
                <td className="text-start py-5 ps-4"><button type="button" onClick={() => openEditModal(service)} className="text-xs font-semibold text-brand hover:underline">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {addServiceModal && (
        <div className="h-screen fixed top-0 left-0 bg-black/50 w-full z-50 p-4 flex justify-center items-center">
          <div className="bg-white max-h-[90%] overflow-auto w-full md:w-1/2 lg:w-1/3 rounded-md">
            <div className="p-4 md:p-6 border-b font-medium bg-white sticky top-0 flex justify-between items-center text-sm">
              <div>{editingService ? "Edit service" : "Add new service"}</div>
              <button type="button" className="cursor-pointer" onClick={closeServiceModal} aria-label="Close">
                <img src={close} alt="" className="h-4" />
              </button>
            </div>
            <div className="p-4 md:p-6 grid gap-4">
              <Input label="Service name:" placeholder="e.g. Knotless braids" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Amount:" placeholder="$0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
              <div>
                <label className="font-medium text-sm" htmlFor="service-duration">Duration:</label>
                <select
                  id="service-duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="mt-1 w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] focus:outline-brand"
                >
                  {Array.from({ length: 32 }, (_, index) => (index + 1) * 15).map((minutes) => (
                    <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Choose how long this service blocks the calendar.</p>
              </div>
              {modalError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <span>{modalError}</span>
                </div>
              )}
              <Buttons btnType="primary" btnText={saving ? "Saving..." : editingService ? "Save changes" : "Add service"} onClick={addService} disabled={saving} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
