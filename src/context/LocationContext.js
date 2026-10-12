import { createContext, useContext, useState, useEffect } from "react";
import { APIService } from "../hooks/remote/apiService";
import { SAVED_LOCATION_KEY } from "../utils/constant";
import { toProvinceName } from "../utils/signupValidation";

/** Where searches start when the visitor's own location is unknown or outside Canada. */
export const DEFAULT_LOCATION = Object.freeze({
  latitude: 53.5461,
  longitude: -113.4857,
  city: "Edmonton",
  province: "Alberta",
  country: "Canada",
  source: "default",
});

/**
 * The marketplace only lists Canadian professionals, so a detected location
 * outside Canada (a visitor abroad, a VPN) would search an empty map: "Karachi,
 * Sindh" found nobody. Such a location is replaced by the Canadian default, and
 * a Canadian one has its province written the way the rest of the site writes
 * it, so the city and province shown always belong together.
 */
export function canadianLocationOrDefault(found) {
  if (!found) return { ...DEFAULT_LOCATION };
  const country = String(found.country || "").trim();
  const inCanada = !country || /^(canada|ca)$/i.test(country);
  const province = toProvinceName(found.province);
  if (!inCanada || (found.province && !province)) return { ...DEFAULT_LOCATION };
  return { ...found, province: province || found.province || "", country: "Canada" };
}

const LocationContext = createContext(null);

// A manually chosen location (via the Change-location picker) is persisted so
// it survives navigation and reloads — auto-detection only runs when there is
// no saved override yet. What comes back goes through the same Canada check as
// a detected location: storage can hold a value from an older build, or one
// written by hand, and "Karachi, Sindh" must not skip the check by being saved.
export function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
    return canadianLocationOrDefault(saved);
  } catch (e) {
    return null;
  }
}

const savedLocation = loadSavedLocation();

/**
 * Provides the user's location (lat/lng/city/province) globally.
 * Auto-detects from GPS/IP on first mount; the user can override it and the
 * choice persists for the session. On logout or session timeout the location
 * is reset (via clearAuthToken -> clearSavedUserLocation) so a fresh login
 * polls the browser/IP again instead of reusing a stale position.
 */
export function LocationProvider({ children }) {
  const [location, setLocation] = useState(savedLocation);
  const [loading, setLoading] = useState(!savedLocation);
  const [nonce, setNonce] = useState(0);

  // Reset + re-detect whenever the saved location is cleared (logout / timeout).
  useEffect(() => {
    const onReset = () => {
      setLocation(null);
      setLoading(true);
      setNonce((n) => n + 1);
    };
    window.addEventListener("rapidstylers:location-reset", onReset);
    return () => window.removeEventListener("rapidstylers:location-reset", onReset);
  }, []);

  useEffect(() => {
    // A saved override (manual choice) takes precedence — skip detection.
    if (location) return;

    // Try browser geolocation first (precise GPS), reverse-geocode it to a
    // city/province, and fall back to IP detection if that fails.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Reverse-geocode the GPS point to get city + province
          APIService.reverseGeocode(latitude, longitude)
            .then((res) => {
              const data = res.data?.data;
              if (data && data.city) {
                setLocation(canadianLocationOrDefault({ ...data, latitude, longitude, source: "gps" }));
                setLoading(false);
              } else {
                // Reverse geocoding returned no city (Google key unconfigured,
                // or the point isn't resolvable). Fall back to IP to get a
                // city/province label while KEEPING the precise GPS coords, so
                // the radius search stays accurate instead of showing "Unknown".
                detectFromIP({ latitude, longitude });
              }
            })
            .catch(() => {
              // Reverse geocoding unavailable (no key / backend down) — get a
              // city/province from IP while keeping the precise GPS coords.
              detectFromIP({ latitude, longitude });
            });
        },
        () => {
          // Browser denied — fall back to IP
          detectFromIP();
        },
        { timeout: 5000 }
      );
    } else {
      detectFromIP();
    }

    function detectFromIP(chosenCoords = null) {
      APIService.detectLocation()
        .then((res) => {
          const data = res.data?.data;
          if (data && data.latitude) {
            setLocation(canadianLocationOrDefault({
              ...data,
              ...(chosenCoords
                ? { latitude: chosenCoords.latitude, longitude: chosenCoords.longitude, source: "gps+ip" }
                : { source: "ip" }),
            }));
          }
        })
        .catch(() => {
          // Default to Edmonton if everything fails
          setLocation({ ...DEFAULT_LOCATION });
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  const updateLocation = (newLoc) => {
    setLocation(newLoc);
    try {
      localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(newLoc));
    } catch (e) {
      // Storage unavailable (private mode) — in-memory only.
    }
  };

  return (
    <LocationContext.Provider value={{ location, loading, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useUserLocation() {
  return useContext(LocationContext);
}
