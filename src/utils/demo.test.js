import { demoBooking } from "./demo";

describe("demoBooking", () => {
  it("is off on the live site, closed on the demo before launch, and live after", () => {
    expect(demoBooking(false, false)).toBeNull();
    expect(demoBooking(false, true)).toBeNull();
    expect(demoBooking(true, false)).toBe("closed");
    expect(demoBooking(true, true)).toBe("live");
  });
});
