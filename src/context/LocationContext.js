import { createContext, useContext, useState, useEffect } from "react";
import { APIService } from "../hooks/remote/apiService";
import { SAVED_LOCATION_KEY } from "../utils/constant";

const LocationContext = createContext(null);

// A manually chosen location (via the Change-location picker) is persisted so
// it survives navigation and reloads — auto-detection only runs when there is
// no saved override yet.
function loadSavedLocation() {
  try {
    const raw = localStorage.getItem(SAVED_LOCATION_KEY);
    return raw ? JSON.parse(raw) : null;
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
                setLocation({ ...data, latitude, longitude, source: "gps" });
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
            setLocation({
              ...data,
              ...(chosenCoords
                ? { latitude: chosenCoords.latitude, longitude: chosenCoords.longitude, source: "gps+ip" }
                : { source: "ip" }),
            });
          }
        })
        .catch(() => {
          // Default to Edmonton if everything fails
          setLocation({
            latitude: 53.5461,
            longitude: -113.4857,
            city: "Edmonton",
            province: "Alberta",
            country: "Canada",
            source: "default",
          });
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
