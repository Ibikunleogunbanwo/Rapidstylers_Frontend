import { render, screen } from "@testing-library/react";
import LocationPicker from "./locationPicker";

// The picker reads the current location from context and lets the user save a
// new one. Both are exercised here; updateLocation is only used on Save.
jest.mock("../context/LocationContext", () => ({
  useUserLocation: () => ({
    location: {
      city: "Edmonton",
      province: "Alberta",
      country: "Canada",
      source: "manual",
    },
    updateLocation: jest.fn(),
  }),
}));

const MOBILE_VIEWPORT = { width: 375, height: 667 };

describe("LocationPicker viewport containment", () => {
  beforeEach(() => {
    // Simulate a phone-sized viewport before each render.
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: MOBILE_VIEWPORT.width,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: MOBILE_VIEWPORT.height,
    });
    document.body.innerHTML = "";
  });

  test("renders the dialog through a portal directly under document.body", () => {
    render(<LocationPicker onClose={jest.fn()} />);

    const overlay = document.querySelector(".fixed.inset-0");
    expect(overlay).not.toBeNull();
    // The portal escapes the backdrop-blur header that used to hijack
    // position: fixed, so the overlay must be a direct child of <body>.
    expect(overlay.parentElement).toBe(document.body);
  });

  test("anchors the overlay to the viewport with explicit inset offsets at mobile width", () => {
    render(<LocationPicker onClose={jest.fn()} />);

    const overlay = document.querySelector(".fixed.inset-0");
    expect(overlay).toBeInTheDocument();

    // inset-0 pins top/right/bottom/left to zero; without it a fixed element
    // falls back to its static flow position and can land off-screen.
    expect(overlay.className).toContain("inset-0");
    // The overlay must sit above app content (hero z-10, header z-20).
    expect(overlay.className).toContain("z-50");
    // Tall content scrolls inside the overlay instead of pushing off-screen.
    expect(overlay.className).toContain("overflow-y-auto");
  });

  test("keeps the dialog width inside the viewport at mobile width", () => {
    render(<LocationPicker onClose={jest.fn()} />);

    const overlay = document.querySelector(".fixed.inset-0");
    const card = overlay.querySelector(".bg-white.rounded-md");
    expect(card).toBeInTheDocument();

    // On mobile the card is w-full inside the px-4 padded overlay, so its
    // right edge can never exceed the viewport.
    expect(card.className).toContain("w-full");
    expect(overlay.className).toContain("px-4");
    // my-auto keeps it centered when there is room and scrollable from the top
    // when the card is taller than a short phone screen.
    expect(card.className).toContain("my-auto");
  });

  test("stacks the action row on mobile so buttons cannot overflow horizontally", () => {
    render(<LocationPicker onClose={jest.fn()} />);

    // The row contains the detect link and the Cancel/Save buttons.
    const detectLink = screen.getByText("Use my current location");
    const row = detectLink.closest("div");
    expect(row).not.toBeNull();

    // flex-col-reverse on mobile stacks the buttons above the link; the sm:
    // prefix restores the side-by-side layout only at ≥640px.
    expect(row.className).toContain("flex-col-reverse");
    expect(row.className).toContain("sm:flex-row");
  });

  test("does not use the fragile h-screen/w-full overlay without offsets", () => {
    render(<LocationPicker onClose={jest.fn()} />);

    const overlay = document.querySelector(".fixed.inset-0");
    // Regression guard: the old pattern was `fixed bg-black/60 h-screen w-full`
    // with no top/left/right/bottom — exactly what broke on mobile.
    expect(overlay.className).not.toContain("h-screen");
  });
});
