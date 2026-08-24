import { useRef, useEffect, useState } from "react";
import { APIService } from "../hooks/remote/apiService";

/**
 * Address input for styler signup backed by Google Places Autocomplete,
 * proxied through the backend (/place_autocomplete + /place_details) so the
 * Google API key never ships in the browser bundle.
 *
 * - While typing, address suggestions (Canada-only) appear in a dropdown.
 * - On selection, `onChange` is called with a fully parsed address:
 *   { formattedAddress, streetAddress, unit, city, province, postalCode,
 *     country, latitude, longitude }.
 * - If the proxy is unreachable it degrades to a plain text input that emits
 *   the typed value on blur, so the form still works without Google.
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
  label = "Address:",
}) => {
  const inputRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const debounceRef = useRef(null);
  const selectedRef = useRef(false);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

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

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const fetchSuggestions = (query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const text = query.trim();
    if (!text) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await APIService.placeAutocomplete(text);
        const items = res.data?.data || [];
        setSuggestions(items);
        setOpen(items.length > 0);
        setFailed(false);
      } catch {
        // Proxy unreachable — fall back to free text.
        setSuggestions([]);
        setOpen(false);
        setFailed(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = async (placeId, description) => {
    setOpen(false);
    if (!placeId) return;

    try {
      const res = await APIService.placeDetails(placeId);
      const d = res.data?.data;
      if (d) {
        selectedRef.current = true;
        const formatted = d.formattedAddress || description;
        if (inputRef.current) inputRef.current.value = formatted;
        onChangeRef.current?.({
          formattedAddress: formatted,
          streetAddress: d.streetAddress || "",
          unit: d.unit || "",
          city: d.city || "",
          province: d.province || "",
          postalCode: d.postalCode || "",
          country: d.country || "Canada",
          latitude: d.latitude ?? null,
          longitude: d.longitude ?? null,
        });
        return;
      }
    } catch {
      // fall through to free text
    }
    // Details call failed — keep the picked description as typed text.
    if (inputRef.current) inputRef.current.value = description;
  };

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
    <div className={`grid w-full ${className} relative`}>
      <span className="font-medium text-sm pb-1">{label}</span>
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        autoComplete="off"
        onChange={(e) => {
          selectedRef.current = false;
          fetchSuggestions(e.target.value);
        }}
        onBlur={() => {
          // Close the dropdown; let the click on an item win (onMouseDown
          // fires before blur).
          setTimeout(() => setOpen(false), 150);
          if (!selectedRef.current) emitFreeText();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand"
        placeholder={placeholder}
      />

      {/* Suggestion dropdown */}
      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border border-[#c4c4c440] bg-white shadow-lg">
          {loading && (
            <li className="px-3 py-2 text-xs text-gray-400">Loading suggestions…</li>
          )}
          {!loading &&
            suggestions.map((s) => (
              <li key={s.placeId || s.description}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(s.placeId, s.description);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#c4c4c416] focus:bg-[#c4c4c416] transition-colors"
                >
                  {s.description}
                </button>
              </li>
            ))}
        </ul>
      )}

      {failed && (
        <p className="text-[10px] text-gray-400 mt-1">
          Address suggestions unavailable. Type the full address and fill in
          city, province and postal code below.
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;
