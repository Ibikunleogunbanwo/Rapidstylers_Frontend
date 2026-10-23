
describe("vendorMinutesNow", () => {
  test("reads the time on the professional's clock, not the visitor's", async () => {
    const { vendorMinutesNow } = await import("./vendorTimeZone");
    const instant = new Date("2026-09-15T16:00:00Z");
    expect(vendorMinutesNow({ timeZone: "America/Edmonton" }, instant)).toBe(10 * 60);
    expect(vendorMinutesNow({ timeZone: "America/Vancouver" }, instant)).toBe(9 * 60);
    expect(vendorMinutesNow({ province: "Ontario" }, instant)).toBe(12 * 60);
  });
});
