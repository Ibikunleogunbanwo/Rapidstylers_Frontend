import { useRef, useEffect, useState } from "react";
import { loadGoogleMaps, placeToAddressData } from "../utils/loadGoogleMaps";

/**
 * Address input for styler signup backed by Google Places Autocomplete.
 *
 * - While typing, Google suggests real addresses (restricted to Canada).
 * - On selection, `onChange` is called with a fully parsed address:
 *   { formattedAddress, streetAddress, unit, city, province, postalCode,
 *     country, latitude, longitude }.
 * - If the Maps script can't load (no key, blocked network, invalid key)
 *   it degrades to a plain text input that emits the typed value on blur,
 *   so the form still works without Google.
 *
 * Props:
 *   onChange(data) — called with parsed address data
 *   value          – initial value (only used on mount)
 *   placeholder
 *   className
 */
const AddressAutocomplete = ({
  onChange,
  value = "",
  placeholder = "Start typing your business address…",
  className = "",
}) => {
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const autoCompleteRef = useRef(null);
  const placeSelectedRef = useRef(false);
  const [mapsFailed, setMapsFailed] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Set initial value once on mount (uncontrolled input)
  useEffect(() => {
    if (inputRef.current && value && !inputRef.current._initialized) {
      inputRef.current.value = value;
      inputRef.current._initialized = true;
    }
  }, [value]);

  // Attach Google Places Autocomplete once the script is available
  useEffect(() => {
    let cancelled = false;

    const fallbackToPlainText = () => {
      if (cancelled) return;
      setMapsFailed(true);
      // Google disables the input when its key is invalid — undo that so
      // the user can still type a full address by hand.
      if (inputRef.current) {
        inputRef.current.disabled = false;
      }
    };

    const attachAutocomplete = (maps) => {
      if (cancelled || !inputRef.current) return;
      const autocomplete = new maps.places.Autocomplete(inputRef.current, {
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["address"],
        componentRestrictions: { country: "CA" },
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry) return;
        placeSelectedRef.current = true;
        onChangeRef.current?.(placeToAddressData(place));
      });

      autoCompleteRef.current = autocomplete;
    };

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !inputRef.current) return;
        // Probe the Places service first — with an invalid or restricted key
        // the widget silently disables the input, so detect that up front.
        const service = new maps.places.AutocompleteService();
        let probed = false;
        const onProbeResult = (predictions, status) => {
          if (cancelled || probed) return;
          probed = true;
          clearTimeout(probeTimeout);
          if (status === "OK" || status === "ZERO_RESULTS") {
            attachAutocomplete(maps);
          } else {
            fallbackToPlainText();
          }
        };
        // Some key failures never invoke the callback — bail out after a bit.
        const probeTimeout = setTimeout(() => onProbeResult(null, "TIMEOUT"), 4000);
        try {
          service.getPlacePredictions(
            { input: "Edmonton", componentRestrictions: { country: "CA" } },
            onProbeResult
          );
        } catch {
          onProbeResult(null, "ERROR");
        }
      })
      .catch(fallbackToPlainText);

    return () => {
      cancelled = true;
      if (autoCompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(autoCompleteRef.current);
      }
    };
  }, []);

  const emitFreeText = () => {
    const text = inputRef.current?.value || "";
    if (!text) return;
    onChangeRef.current?.({
      formattedAddress: text,
      streetAddress: text,
      unit: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Canada",
      latitude: null,
      longitude: null,
    });
  };

  return (
    <div className={`grid w-full ${className}`}>
      <span className="font-medium text-sm pb-1">Address:</span>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        autoComplete="off"
        onBlur={(e) => {
          // Only fall back to free text if the user didn't pick a suggestion
          // (place_changed fires before blur, so the ref is set by then).
          if (!placeSelectedRef.current) emitFreeText();
        }}
        className="w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand"
        placeholder={placeholder}
      />
      {mapsFailed && (
        <p className="text-[10px] text-gray-400 mt-1">
          Address suggestions unavailable — type the full address and fill in
          city, province and postal code below.
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
