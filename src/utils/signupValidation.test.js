import {
  cityError,
  formatCanadianPhone,
  formatPostalCode,
  nameError,
  phoneDigits,
  phoneError,
  postalCodeError,
  provinceError,
  toProvinceName,
} from "./signupValidation";

describe("nameError", () => {
  it.each(["Al", "Li", "李明", "O'Brien", "Anne-Marie", "José", "St. John", "A"])("accepts %s", (name) => {
    expect(nameError(name, "first name")).toBe("");
  });
  it.each(["123", "John123", "@#$%^", "<script>alert(1)</script>", "😀😀", "x".repeat(51), "-Ann"])(
    "rejects %s",
    (name) => {
      expect(nameError(name, "first name")).not.toBe("");
    }
  );
  it("trims before checking and requires a value unless optional", () => {
    expect(nameError("  John  ", "first name")).toBe("");
    expect(nameError("   ", "first name")).toBe("First name is required");
    expect(nameError("", "first name", { optional: true })).toBe("");
  });
});

describe("phone", () => {
  it.each(["5875551234", "+1 (587) 555-1234", "587-555-1234", "15875551234", "٥٨٧٥٥٥١٢٣٤"])("accepts %s", (phone) => {
    expect(phoneError(phone)).toBe("");
    expect(phoneDigits(phone)).toBe("5875551234");
  });
  it("reports too many digits instead of cutting them off", () => {
    expect(phoneError("58755512345")).toMatch(/Too many digits/);
    expect(phoneError("92 300 1234567")).toMatch(/Too many digits/);
    expect(formatCanadianPhone("58755512345")).toBe("58755512345");
  });
  it("rejects invalid area codes and exchanges", () => {
    expect(phoneError("0000000000")).toMatch(/cannot start with 0 or 1/);
    expect(phoneError("1234567890")).toMatch(/cannot start with 0 or 1/);
    expect(phoneError("5871551234")).toMatch(/cannot start with 0 or 1/);
  });
  it("explains short numbers and formats as typed", () => {
    expect(phoneError("587555123")).toMatch(/all 10 digits/);
    expect(phoneError("")).toBe("Phone number is required");
    expect(formatCanadianPhone("587abc5551234")).toBe("(587) 555-1234");
    expect(formatCanadianPhone("٥٨٧٥٥٥١٢٣٤")).toBe("(587) 555-1234");
  });
});

describe("address fields", () => {
  it("maps codes and accents to the dropdown's names", () => {
    expect(toProvinceName("AB")).toBe("Alberta");
    expect(toProvinceName("Québec")).toBe("Quebec");
    expect(toProvinceName("sindh")).toBe("");
    expect(provinceError("Sindh")).not.toBe("");
    expect(provinceError("Nunavut")).toBe("");
  });
  it("checks city and postal code", () => {
    expect(cityError("Saint-Jean-sur-Richelieu")).toBe("");
    expect(cityError("Calgary1")).not.toBe("");
    expect(postalCodeError("T2P 1B5")).toBe("");
    expect(postalCodeError("12345")).not.toBe("");
    expect(formatPostalCode("t2p1b5")).toBe("T2P 1B5");
  });
});
