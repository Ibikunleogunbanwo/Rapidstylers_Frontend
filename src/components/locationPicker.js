import { useState } from "react";
import { createPortal } from "react-dom";
import Modal from "./modals";
import HeroSelect from "./heroSelect";
import Input from "./input";
import { useUserLocation } from "../context/LocationContext";
import { cityProvinceOf } from "../utils/canadaCities";

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
];

const provinceOptions = PROVINCES.map((p) => ({ value: p, label: p }));

/**
 * Change-location modal. Saves the chosen city/province to the global
 * LocationContext (persisted) so the navbar badge and searches use it.
 */
const LocationPicker = ({ onClose }) => {
  const { location, updateLocation } = useUserLocation();
  const [province, setProvince] = useState(location?.province || "");
  const [city, setCity] = useState(location?.city || "");

  // When the typed city is a known Canadian city that belongs to a different
  // province (e.g. Calgary with Saskatchewan selected), tell the user and let
  // Save correct it instead of silently saving a contradiction.
  const resolvedProvince = cityProvinceOf(city);
  const cityMismatch =
    resolvedProvince && province && resolvedProvince !== province
      ? {
          message: `${city.trim()} is in ${resolvedProvince}. We'll save it as ${resolvedProvince}.`,
          resolvedProvince,
        }
      : null;

  const handleSave = () => {
    // The city's real province wins when it is known; otherwise keep the
    // selected province. Province is required, so fall back to the current one.
    const effectiveProvince = resolvedProvince || province;
    if (!effectiveProvince) {
      return;
    }
    // A manual choice has no reliable coordinates: drop lat/lng so searches
    // fall back to the province/city endpoints instead of a stale GPS radius.
    updateLocation({
      city: city.trim(),
      province: effectiveProvince,
      country: "Canada",
      source: "manual",
    });
    onClose();
  };

  const handleDetect = () => {
    try {
      localStorage.removeItem("userLocation");
    } catch (e) {
      // Ignore — in-memory detection still runs on reload.
    }
    window.location.reload();
  };

  return createPortal(
    <Modal isVisible onClose={onClose} modalTitle={"Change location"} width={"md:w-[45%]"}>
      <div className="text-sm text-black/70">
        Professionals are matched to the area you choose. Leave the city blank
        to search the whole province.
      </div>
      <HeroSelect
        selectOptions={provinceOptions}
        valueKey={"value"}
        labelKey={"label"}
        selectName={"Province"}
        selectValue={province}
        onChange={(e) => setProvince(e.target.value)}
      />
      <Input
        label={"City (optional)"}
        name={"city"}
        value={city}
        placeholder={"e.g. Calgary"}
        onChange={(e) => setCity(e.target.value)}
      />
      {cityMismatch && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {cityMismatch.message}
        </p>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between pt-2 gap-3">
        <button
          type="button"
          onClick={handleDetect}
          className="text-xs text-brand underline self-start sm:self-auto"
        >
          Use my current location
        </button>
        <div className="flex gap-3 justify-end sm:justify-start">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-md border text-sm text-black/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!province && !resolvedProvince}
            className="px-6 py-2.5 rounded-md bg-brand text-white text-sm font-semibold disabled:opacity-50"
          >
            Save location
          </button>
        </div>
      </div>
    </Modal>,
    document.body
  );
};

export default LocationPicker;
