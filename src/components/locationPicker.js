import { useState } from "react";
import { AccessibleModal as Modal } from "./accessibleDialog";
import HeroSelect from "./heroSelect";
import Input from "./input";
import { useUserLocation } from "../context/LocationContext";
import { cityProvinceOf } from "../utils/canadaCities";
import { PROVINCE_NAMES, toProvinceName } from "../utils/signupValidation";

// All 13 provinces and territories, the same list every form on the site uses.
const PROVINCES = PROVINCE_NAMES;

// The empty first option keeps an unset province visibly unset. Without it the
// select drew "Alberta" (its first option) while the form held no province.
const provinceOptions = [
  { value: "", label: "Choose a province or territory" },
  ...PROVINCES.map((p) => ({ value: p, label: p })),
];

/**
 * Change-location modal. Saves the chosen city/province to the global
 * LocationContext (persisted) so the navbar badge and searches use it.
 */
const LocationPicker = ({ onClose }) => {
  const { location, updateLocation } = useUserLocation();
  // A location outside Canada never pre-fills the form: "Alberta" beside
  // "Karachi" was a pair that belonged to no real place.
  const knownProvince = toProvinceName(location?.province);
  const [province, setProvince] = useState(knownProvince);
  const openingCity = knownProvince ? location?.city || "" : "";
  const [city, setCity] = useState(openingCity);
  // Whether the visitor picked the province themselves in this dialog, as
  // opposed to it being carried over from the location the dialog opened with.
  const [provinceChosen, setProvinceChosen] = useState(false);

  // When the typed city is a known Canadian city that belongs to a different
  // province (e.g. Calgary with Saskatchewan selected), tell the user and let
  // Save correct it instead of silently saving a contradiction.
  const resolvedProvince = cityProvinceOf(city);

  // A city we cannot place is only saved with a province the visitor chose. The
  // carried-over province used to be paired with whatever was typed, so a new
  // town ended up "in" the province of the old location. Until they choose, the
  // select shows as unset and Save stays disabled.
  const typedCity = city.trim();
  const needsProvince =
    Boolean(typedCity) &&
    !resolvedProvince &&
    !provinceChosen &&
    typedCity.toLowerCase() !== openingCity.trim().toLowerCase();
  const shownProvince = needsProvince ? "" : province;
  const cityMismatch =
    resolvedProvince && province && resolvedProvince !== province
      ? {
          message: `${city.trim()} is in ${resolvedProvince}. We'll save it as ${resolvedProvince}.`,
          resolvedProvince,
        }
      : null;

  const handleSave = () => {
    // The city's real province wins when it is known; otherwise keep the
    // province the visitor chose. Province is required.
    const effectiveProvince = resolvedProvince || shownProvince;
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
        selectValue={shownProvince}
        onChange={(e) => {
          setProvince(e.target.value);
          setProvinceChosen(Boolean(e.target.value));
        }}
      />
      <Input
        label={"City (optional)"}
        name={"city"}
        value={city}
        placeholder={"e.g. Calgary"}
        onChange={(e) => setCity(e.target.value)}
      />
      {needsProvince && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          We don't recognise {typedCity}. Choose its province to save it.
        </p>
      )}
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
            disabled={!shownProvince && !resolvedProvince}
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
