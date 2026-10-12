import { canadianLocationOrDefault, DEFAULT_LOCATION } from "./LocationContext";

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
