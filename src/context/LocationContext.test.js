import { canadianLocationOrDefault, DEFAULT_LOCATION, loadSavedLocation } from "./LocationContext";
import { SAVED_LOCATION_KEY } from "../utils/constant";

describe("canadianLocationOrDefault", () => {
  it("replaces a location outside Canada with the Canadian default", () => {
    const result = canadianLocationOrDefault({ city: "Karachi", province: "Sindh", country: "Pakistan", latitude: 24.8, longitude: 67 });
    expect(result).toMatchObject({ city: DEFAULT_LOCATION.city, province: DEFAULT_LOCATION.province, country: "Canada" });
  });
  it("replaces a non-Canadian region even without a country", () => {
    expect(canadianLocationOrDefault({ city: "Karachi", province: "Sindh" }).city).toBe(DEFAULT_LOCATION.city);
  });
  it("keeps a Canadian location and spells its province in full", () => {
    expect(canadianLocationOrDefault({ city: "Montréal", province: "QC", country: "Canada", latitude: 45.5 }))
      .toMatchObject({ city: "Montréal", province: "Quebec", country: "Canada", latitude: 45.5 });
  });
});

describe("loadSavedLocation", () => {
  afterEach(() => localStorage.removeItem(SAVED_LOCATION_KEY));
  const save = (value) => localStorage.setItem(SAVED_LOCATION_KEY, typeof value === "string" ? value : JSON.stringify(value));

  it("returns null when nothing is saved", () => {
    expect(loadSavedLocation()).toBeNull();
  });
  it("replaces a saved location outside Canada with the default, as detection does", () => {
    save({ city: "Karachi", province: "Sindh", country: "Pakistan", source: "manual" });
    expect(loadSavedLocation()).toMatchObject({ city: DEFAULT_LOCATION.city, province: DEFAULT_LOCATION.province, country: "Canada" });
  });
  it("spells a saved Canadian province in full", () => {
    save({ city: "Calgary", province: "AB", source: "manual" });
    expect(loadSavedLocation()).toMatchObject({ city: "Calgary", province: "Alberta", country: "Canada", source: "manual" });
  });
  it("ignores a saved value that is not a location", () => {
    save("not json");
    expect(loadSavedLocation()).toBeNull();
    save([1, 2]);
    expect(loadSavedLocation()).toBeNull();
  });
});
