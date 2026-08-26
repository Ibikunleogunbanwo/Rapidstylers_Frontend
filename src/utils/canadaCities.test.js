import { cityProvinceOf } from "./canadaCities";

describe("cityProvinceOf", () => {
  test("maps major cities to their province", () => {
    expect(cityProvinceOf("Calgary")).toBe("Alberta");
    expect(cityProvinceOf("Toronto")).toBe("Ontario");
    expect(cityProvinceOf("Montreal")).toBe("Quebec");
    expect(cityProvinceOf("Vancouver")).toBe("British Columbia");
    expect(cityProvinceOf("Halifax")).toBe("Nova Scotia");
    expect(cityProvinceOf("Winnipeg")).toBe("Manitoba");
    expect(cityProvinceOf("Regina")).toBe("Saskatchewan");
  });

  test("handles case and surrounding whitespace", () => {
    expect(cityProvinceOf("  calgary ")).toBe("Alberta");
    expect(cityProvinceOf("TORONTO")).toBe("Ontario");
  });

  test("handles punctuation and apostrophes", () => {
    // St. John's (Newfoundland) and Saint John (New Brunswick) stay distinct.
    expect(cityProvinceOf("St. John's")).toBe("Newfoundland and Labrador");
    expect(cityProvinceOf("Saint John")).toBe("New Brunswick");
    expect(cityProvinceOf("St. Catharines")).toBe("Ontario");
    expect(cityProvinceOf("Sault Ste. Marie")).toBe("Ontario");
  });

  test("returns null for unknown cities so the user is never blocked", () => {
    expect(cityProvinceOf("Nowhereville")).toBeNull();
    expect(cityProvinceOf("")).toBeNull();
    expect(cityProvinceOf("   ")).toBeNull();
  });
});
