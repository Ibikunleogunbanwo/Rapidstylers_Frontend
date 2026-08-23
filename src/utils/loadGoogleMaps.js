/**
 * Promise-based loader for the Google Maps JavaScript API.
 *
 * Loads the script once (with the `places` library) and resolves with
 * `window.google.maps`. If no key is configured or the script fails to
 * load (bad key, network blocked), it rejects so callers can fall back
 * to a plain text input instead of breaking the form.
 */
let loadPromise = null;

export const GOOGLE_MAPS_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";

export function loadGoogleMaps() {
  if (!GOOGLE_MAPS_KEY) {
    return Promise.reject(new Error("REACT_APP_GOOGLE_MAPS_KEY is not configured"));
  }

  // Already loaded?
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google.maps);
  }

  // Load in progress — reuse it
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = `__gmapsInit_${Date.now()}`;
    const timeout = setTimeout(() => {
      delete window[callbackName];
      reject(new Error("Timed out loading Google Maps"));
    }, 10000);

    window[callbackName] = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      resolve(window.google.maps);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      GOOGLE_MAPS_KEY
    )}&libraries=places&callback=${callbackName}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      loadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Extract structured address parts from a google.maps.places.PlaceResult. */
export function placeToAddressData(place) {
  const parts = {};
  for (const comp of place.address_components || []) {
    const type = comp.types[0];
    if (!type) continue;
    // First match wins; long_name preferred.
    if (parts[type] === undefined) {
      parts[type] = comp.long_name || comp.short_name;
    }
  }

  const streetNumber = parts.street_number || "";
  const route = parts.route || "";
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ");

  return {
    formattedAddress: place.formatted_address || place.name || "",
    streetAddress,
    unit: parts.subpremise || "",
    city: parts.locality || parts.sublocality_level_1 || "",
    province: parts.administrative_area_level_1 || "",
    postalCode: parts.postal_code || "",
    country: parts.country || "",
    latitude: place.geometry?.location?.lat?.() ?? null,
    longitude: place.geometry?.location?.lng?.() ?? null,
  };
}
