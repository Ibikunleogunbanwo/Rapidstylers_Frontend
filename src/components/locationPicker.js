import { useState } from "react";
import Modal from "./modals";
import HeroSelect from "./heroSelect";
import Input from "./input";
import { useUserLocation } from "../context/LocationContext";

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

  const handleSave = () => {
    if (!province) {
      return; // Province is required — the select defaults to the current one.
    }
    // A manual choice has no reliable coordinates: drop lat/lng so searches
    // fall back to the province/city endpoints instead of a stale GPS radius.
    updateLocation({
      city: city.trim(),
      province,
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

  return (
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
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleDetect}
          className="text-xs text-brand underline"
        >
          Use my current location
        </button>
        <div className="flex gap-3">
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
            disabled={!province}
            className="px-6 py-2.5 rounded-md bg-brand text-white text-sm font-semibold disabled:opacity-50"
          >
            Save location
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LocationPicker;
