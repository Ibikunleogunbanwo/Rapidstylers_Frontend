import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStylerList } from "../userLayout/functionalEffects";
import { useUserLocation } from "../../../context/LocationContext";
import LocationPicker from "../../../components/locationPicker";
import { fallbackPhotoFor } from "../../../utils/curatedGallery";

function CategoryCard({ category }) {
  const name = category.serviceName || category.serviceTypeName || "Service";
  const id = category.id ?? category.serviceTypeId;
  const fallback = fallbackPhotoFor(name, String(id));
  const [failedSources, setFailedSources] = useState([]);
  const primary = category.imageUrl?.trim() || fallback?.src || "";
  const image = [primary, fallback?.src].find(source => source && !failedSources.includes(source));
  const showImage = Boolean(image);
  return <Link
    aria-label={name}
    to={`/stylist/${btoa(String(id))}/${btoa(name)}`}
    className="group overflow-hidden rounded-lg border border-black/10 bg-white transition-colors hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
  >
    <div className="aspect-[4/3] overflow-hidden bg-[#f1eef8]">
      {showImage ? <img src={image} alt={name} loading="lazy" decoding="async" onError={() => setFailedSources(previous => [...previous, image])} className="h-full w-full object-cover" /> :
        <div role="img" aria-label={`${name} illustration`} className="flex h-full items-center justify-center text-brand">
          <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="2" className="h-20 w-20" aria-hidden="true">
            <rect x="19" y="22" width="58" height="52" rx="8" />
            <path d="M19 60l17-17 15 14 10-10 16 13" />
            <circle cx="62" cy="36" r="5" />
          </svg>
        </div>}
    </div>
    <div className="flex items-center justify-between gap-3 p-4">
      <span className="text-sm font-semibold text-onSurface">{name}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 shrink-0 text-brand" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
    </div>
  </Link>;
}

const BookAppointment = ({ setPageTitle, setStylerSearchName }) => {
  useEffect(() => {
    setPageTitle?.("Book Appointment");
    document.title = "Book an appointment | RapidStylers";
  }, [setPageTitle]);
  const loadState = useStylerList({ withState: true });
  const categories = loadState.data ?? loadState;
  const [name, setName] = useState("");
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const navigate = useNavigate();
  const { location, loading: locationLoading } = useUserLocation();
  const displayLocation = [location?.city, location?.province].filter(Boolean).join(", ") || (locationLoading ? "Finding your location…" : "Choose a location");
  const params = new URLSearchParams();
  if (location?.province) params.set("province", location.province);
  if (location?.city) params.set("city", location.city);
  const browseHref = `/search${params.size ? `?${params}` : ""}`;

  const searchByName = event => {
    event.preventDefault();
    const term = name.trim();
    if (!term) return;
    setStylerSearchName(term);
    navigate("/searchAStyler");
  };

  return <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-black/10 bg-white">
    <header className="px-5 py-6 sm:px-7">
      <h1 className="text-2xl font-semibold tracking-tight text-onSurface">Book an appointment</h1>
      <p className="mt-2 max-w-lg text-sm leading-6 text-black/60">Choose a service, then select a professional and an available time.</p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md bg-black/[0.03] px-4 py-3">
        <div><p className="text-xs text-black/50">Your location</p><p className="mt-1 text-sm font-medium">{displayLocation}</p></div>
        <button type="button" onClick={() => setLocationPickerOpen(true)} className="text-sm font-medium text-brand underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">Change location</button>
      </div>
    </header>

    <section aria-labelledby="booking-services" className="px-5 pb-7 sm:px-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="booking-services" className="text-lg font-semibold">Choose a service</h2>
        <Link to={browseHref} className="text-sm text-brand underline underline-offset-4">Browse all professionals</Link>
      </div>
      {loadState.loading ? <p role="status" className="py-6 text-sm text-black/60">Loading service categories…</p> : loadState.error ?
        <div role="alert" className="rounded-md border border-red-200 p-4 text-sm"><p>Could not load service categories. You can still browse professionals or search by name.</p><button type="button" onClick={loadState.retry} className="mt-3 text-brand underline underline-offset-4">Retry categories</button></div> : categories.length ?
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">{categories.map(category => <CategoryCard key={category.id ?? category.serviceTypeId} category={category} />)}</div> :
          <p className="rounded-md border border-black/10 p-5 text-sm text-black/60">No service categories are available yet.</p>}
    </section>

    <section aria-labelledby="booking-name-search" className="border-t border-black/10 px-5 py-6 sm:px-7">
      <h2 id="booking-name-search" className="text-lg font-semibold">Find a professional by name</h2>
      <p className="mt-1 text-sm text-black/60">Already know who you want to book? Search for their name or business.</p>
      <form onSubmit={searchByName} className="mt-4">
        <label htmlFor="booking-professional-name" className="mb-2 block text-sm font-medium">Professional name</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="booking-professional-name" type="text" value={name} onChange={event => setName(event.target.value)} placeholder="Name or business name" className="min-w-0 flex-1 rounded-md border border-black/20 px-4 py-3 text-sm focus:outline-brand" />
          <button type="submit" disabled={!name.trim()} className="rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white disabled:cursor-default disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Search by name</button>
        </div>
      </form>
    </section>
    <p className="border-t border-black/10 px-5 py-4 text-xs leading-5 text-black/50 sm:px-7">Book through RapidStylers to keep appointment details and payments in one place.</p>
    {locationPickerOpen && <LocationPicker onClose={() => setLocationPickerOpen(false)} />}
  </div>;
};

export default BookAppointment;
