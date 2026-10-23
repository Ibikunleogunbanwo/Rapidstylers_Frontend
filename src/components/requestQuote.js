import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AccessibleDialog, { DialogCloseButton } from "./accessibleDialog";
import Button from "./button";
import { APIService } from "../hooks/remote/apiService";
import { getAuthToken, getUserRole, setIntendedRoute, showSuccessToastMessage } from "../utils/constant";

const fieldClass = "w-full rounded-md border border-slate-400 bg-white p-3 text-sm focus:outline-brand";
const MIN_DESCRIPTION = 10;

/**
 * "Need something custom?" on a professional's profile: the customer describes
 * a job the service list can't price and the professional answers with a
 * price. Signed-out visitors are sent to sign in and brought back here.
 */
const RequestQuote = ({ stylerId, stylerName, services = [], offersSalonVisits = true, offersHomeVisits = true }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [subServiceId, setSubServiceId] = useState(services[0]?.id ? String(services[0].id) : "");
  const [description, setDescription] = useState("");
  const [preferredDates, setPreferredDates] = useState("");
  const [serviceTime, setServiceTime] = useState(offersSalonVisits ? "visitBarber" : "homeService");
  const [people, setPeople] = useState("1");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  if (services.length === 0) return null;

  const start = () => {
    if (!getAuthToken() || getUserRole() !== "CUSTOMER") {
      setIntendedRoute(window.location.pathname + window.location.search);
      navigate("/login");
      return;
    }
    setOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    if (description.trim().length < MIN_DESCRIPTION) {
      setError("Tell the professional a little more about what you'd like.");
      return;
    }
    setError("");
    setSending(true);
    try {
      await APIService.requestQuote({
        stylerId: String(stylerId),
        subServiceId,
        description: description.trim(),
        preferredDates: preferredDates.trim(),
        serviceTime,
        noOfPeople: Math.min(20, Math.max(1, Number(people) || 1)),
      });
      showSuccessToastMessage("Quote request sent. You'll be notified when the price is ready.");
      setOpen(false);
      setDescription("");
      setPreferredDates("");
      navigate("/myQuotes");
    } catch {
      // APIService shows the reason.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8 rounded-lg border border-brand/25 bg-brand/[0.04] p-5">
      <p className="text-[15px] font-semibold text-onSurface">Need something custom?</p>
      <p className="mt-1 text-sm leading-6 text-black/60">
        Bridal party, extra length, a group booking? Describe it and {stylerName || "this professional"} will send you a
        price. You only pay if you book it.
      </p>
      <Button type="button" size="sm" className="mt-3" onClick={start}>Request a quote</Button>

      <AccessibleDialog
        open={open}
        onClose={() => setOpen(false)}
        label="Request a quote"
        overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-md border bg-white md:w-[520px]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <p className="font-semibold">Request a quote</p>
          <DialogCloseButton onClick={() => setOpen(false)} />
        </div>
        <form noValidate onSubmit={submit} className="grid gap-4 px-6 py-5">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">Closest service</span>
            <select className={fieldClass} value={subServiceId} onChange={(event) => setSubServiceId(event.target.value)}>
              {services.map((service) => (
                <option key={service.id} value={String(service.id)}>{service.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">What would you like?</span>
            <textarea
              className={`${fieldClass} min-h-[120px]`}
              maxLength={1000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Waist-length knotless braids, medium size, with curly ends"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "quote-description-error" : undefined}
            />
            {error && <span id="quote-description-error" role="alert" className="text-xs text-red-700">{error}</span>}
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">When suits you? (optional)</span>
            <input
              className={fieldClass}
              maxLength={200}
              value={preferredDates}
              onChange={(event) => setPreferredDates(event.target.value)}
              placeholder="e.g. Saturday mornings in May"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Where</span>
              <select className={fieldClass} value={serviceTime} onChange={(event) => setServiceTime(event.target.value)}>
                {offersSalonVisits && <option value="visitBarber">I'll visit them</option>}
                {offersHomeVisits && <option value="homeService">They come to me</option>}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">People</span>
              <input
                className={fieldClass}
                type="number"
                min={1}
                max={20}
                value={people}
                onChange={(event) => setPeople(event.target.value)}
              />
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={sending}>{sending ? "Sending…" : "Send request"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>Cancel</Button>
          </div>
        </form>
      </AccessibleDialog>
    </div>
  );
};

export default RequestQuote;
