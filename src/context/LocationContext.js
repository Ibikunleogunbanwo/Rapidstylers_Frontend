import { createContext, useContext, useState, useEffect } from "react";
import { APIService } from "../hooks/remote/apiService";

const LocationContext = createContext(null);

const SAVED_LOCATION_KEY = "userLocation";

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
 * choice persists.
 */
export function LocationProvider({ children }) {
  const [location, setLocation] = useState(savedLocation);
  const [loading, setLoading] = useState(!savedLocation);

  useEffect(() => {
    // A saved override (manual choice) takes precedence — skip detection.
    if (savedLocation) return;

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
              } else {
                setLocation({
                  latitude,
                  longitude,
                  city: "",
                  province: "",
                  source: "browser",
                });
              }
            })
            .catch(() => {
              // Reverse geocoding unavailable (no key / backend down) — keep
              // the raw GPS coords so radius search still works.
              setLocation({ latitude, longitude, city: "", province: "", source: "browser" });
            })
            .finally(() => setLoading(false));
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

    function detectFromIP() {
      APIService.detectLocation()
        .then((res) => {
          const data = res.data?.data;
          if (data && data.latitude) {
            setLocation({ ...data, source: "ip" });
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
  }, []);

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
