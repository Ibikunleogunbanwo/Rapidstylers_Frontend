import { useEffect, useState } from "react";
import Button from "../../components/button";
import StylerDialog from "./stylerComponents/stylerDialog";
import { StylerField } from "./stylerComponents/stylerField";
import { APIService } from "../../hooks/remote/apiService";
import { getAuthToken, showSuccessToastMessage } from "../../utils/constant";

export const MAX_SERVICE_PRICE = 10000;

/** What is wrong with a typed amount, or null for a price the form will send. */
export const servicePriceProblem = (value) => {
  const text = String(value ?? "").trim();
  if (!text) return "Amount is required";
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return "Enter an amount in dollars, e.g. 45 or 45.50 (up to 2 decimals)";
  const amount = Number(text);
  if (amount <= 0) return "Amount must be greater than $0";
  if (amount > MAX_SERVICE_PRICE) return `Amount cannot be more than $${MAX_SERVICE_PRICE.toLocaleString("en-CA")}`;
  return null;
};

const formatDuration = (minutes) => {
  const value = Number(minutes || 60);
  if (value < 60) return `${value} min`;
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
};

// A quote-priced service reads as a starting price, so the list says so.
const PriceText = ({ service }) => (
  service.priceOnQuote ? <span>From ${service.price} <span className="text-xs text-brand">· on quote</span></span> : <span>${service.price}</span>
);

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [addServiceModal, setAddServiceModal] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [priceOnQuote, setPriceOnQuote] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const loadServices = async () => {
    setLoadError("");
    const session = getAuthToken();
    if (!session) { setLoading(false); return; }
    setLoading(true);
    try {
      const response = await APIService.listSubServices("self");
      setServices(response.data?.data || []);
    } catch (error) {
      setLoadError("Could not load your services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const closeServiceModal = (force = false) => {
    if (saving && force !== true) return;
    setAddServiceModal(false);
    setEditingService(null);
    setName("");
    setPrice("");
    setDurationMinutes("60");
    setPriceOnQuote(false);
    setModalError("");
    setFieldErrors({});
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setName(service.name || "");
    setPrice(String(service.price || "").replace(/[$,\s]/g, ""));
    setDurationMinutes(String(service.durationMinutes || 60));
    setPriceOnQuote(Boolean(service.priceOnQuote));
    setAddServiceModal(true);
  };

  const addService = async () => {
    if (saving) return;
    const duration = Number(durationMinutes);
    const errors = {};
    if (!name.trim()) errors.name = "Service name is required";
    else if (name.trim().length > 100) errors.name = "Keep the service name under 100 characters";
    const priceProblem = servicePriceProblem(price);
    if (priceProblem) errors.price = priceProblem;
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    if (!Number.isInteger(duration) || duration < 15 || duration > 480 || duration % 15 !== 0) {
      setModalError("Duration must be in 15-minute increments between 15 and 480 minutes");
      return;
    }
    setModalError("");
    setSaving(true);
    try {
      if (editingService) {
        await APIService.updateSubService({
          id: editingService.id,
          name: name.trim(),
          price: Number(price).toFixed(2),
          durationMinutes: duration,
          priceOnQuote,
        });
        showSuccessToastMessage("Service updated");
      } else {
        await APIService.createSubService({
          name: name.trim(),
          price: Number(price).toFixed(2),
          durationMinutes: String(duration),
          priceOnQuote,
        });
        showSuccessToastMessage("Service added");
      }
      closeServiceModal(true);
      await loadServices();
    } catch (error) {
      setModalError(error?.response?.data?.message || error?.message || "Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <div className="border-b border-black/10 p-4 font-medium text-sm flex gap-4 justify-between items-center">
        <span>My services</span>
        <button
          type="button"
          className="text-brand text-xs cursor-pointer"
          onClick={() => setAddServiceModal(true)}
        >
          + Add a new service
        </button>
      </div>
      {loading ? (
        <p className="px-4 py-6 text-sm text-gray-500">Loading services...</p>
      ) : loadError ? (
        <div role="alert" className="p-4 text-sm text-red-700">{loadError} <button type="button" onClick={loadServices}>Retry</button></div>
      ) : services.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500">No services added yet.</p>
      ) : (
        <>
          {/* Phones: one stacked card per service, so status and the action are never off-screen. */}
          <ul className="grid gap-2 p-2 md:hidden" aria-label="My services">
            {services.map((service, index) => (
              <li key={service.id || index} className="rounded-md border border-black/10 p-3 text-[13px]">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 break-words font-medium">{service.name}</p>
                  <button type="button" onClick={() => openEditModal(service)} aria-label={`Edit ${service.name}`} className="shrink-0 text-xs font-semibold text-brand hover:underline">Edit</button>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-black/70">
                  <div><dt className="text-[11px] text-black/45">Amount</dt><dd><PriceText service={service} /></dd></div>
                  <div><dt className="text-[11px] text-black/45">Duration</dt><dd>{formatDuration(service.durationMinutes)}</dd></div>
                  <div><dt className="text-[11px] text-black/45">Status</dt><dd>{service.status || "Active"}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="m-2 hidden md:block">
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
                {services.map((service, index) => (
                  <tr className="hover:bg-black/[0.04]" key={service.id || index}>
                    <td className="text-start py-5 ps-4">{index + 1}</td>
                    <td className="text-start py-5 ps-4 truncate max-w-48 md:max-w-80">{service.name}</td>
                    <td className="text-start py-5 ps-4"><PriceText service={service} /></td>
                    <td className="text-start py-5 ps-4">{formatDuration(service.durationMinutes)}</td>
                    <td className="text-start py-5 ps-4">{service.status || "Active"}</td>
                    <td className="text-start py-5 ps-4"><button type="button" onClick={() => openEditModal(service)} aria-label={`Edit ${service.name}`} className="text-xs font-semibold text-brand hover:underline">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <StylerDialog
        isVisible={addServiceModal}
        onClose={() => closeServiceModal()}
        title={editingService ? "Edit service" : "Add new service"}
        width="md:w-1/2 lg:w-1/3"
      >
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            addService();
          }}
        >
        <p className="text-xs text-black/55"><span aria-hidden="true" className="text-red-600">*</span> Required field</p>
        <StylerField
          label="Service name"
          name="name"
          placeholder="e.g. Knotless braids"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
        />
        <StylerField
          label="Amount ($)"
          name="price"
          type="number"
          inputMode="decimal"
          min="0"
          max={MAX_SERVICE_PRICE}
          step="0.01"
          placeholder="0.00"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          error={fieldErrors.price}
        />
        <label className="flex items-start gap-3 rounded-md border border-black/10 p-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand"
            checked={priceOnQuote}
            onChange={(e) => setPriceOnQuote(e.target.checked)}
          />
          <span>
            <span className="font-medium">Price on quote</span>
            <span className="block text-xs text-black/55">
              The amount shows as a starting price. Clients request a quote and you send the exact price before they book.
            </span>
          </span>
        </label>
        <div>
          <label className="font-medium text-sm" htmlFor="service-duration">Duration:</label>
          <select
            id="service-duration"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            className="mt-1 w-full p-3 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
          >
            {Array.from({ length: 32 }, (_, index) => (index + 1) * 15).map((minutes) => (
              <option key={minutes} value={minutes}>{formatDuration(minutes)}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Choose how long this service blocks the calendar.</p>
        </div>
        {modalError && (
          <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <span>{modalError}</span>
          </div>
        )}
        <Button variant="primary" type="submit" text={saving ? "Saving..." : editingService ? "Save changes" : "Add service"} disabled={saving} />
        </form>
      </StylerDialog>
    </div>
  );
};

export default Services;
