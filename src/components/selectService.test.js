import { render, screen, fireEvent } from "@testing-library/react";
import SelectService from "./selectService";

// react-scripts resets mock implementations between tests, so the factory only
// creates the fns and beforeEach wires the resolved values — the same pattern
// the existing apiService.test.js uses.
jest.mock("../hooks/remote/apiService", () => ({
  APIService: {
    singleStylerData: jest.fn(),
    estimateBooking: jest.fn(),
    bookAppointment: jest.fn(),
  },
}));
jest.mock("react-router-dom", () => ({ useNavigate: () => jest.fn() }));
jest.mock("../context/LocationContext", () => ({
  useUserLocation: () => ({ location: { latitude: null, longitude: null } }),
}));
jest.mock("../utils/constant", () => ({
  getAuthToken: () => null,
  showErrorToastMessage: jest.fn(),
  showSuccessToastMessage: jest.fn(),
}));

const { APIService } = jest.requireMock("../hooks/remote/apiService");

beforeEach(() => {
  APIService.singleStylerData.mockResolvedValue({
    data: { data: { availability: [], bookedSlots: [], exceptions: [] } },
  });
  APIService.estimateBooking.mockResolvedValue({ data: { data: null } });
});

const renderOpen = () => {
  render(
    <SelectService
      serviceName="Haircut"
      servicePrice="60"
      stylerId="s1"
      subServiceId="ss1"
    />
  );
  fireEvent.click(screen.getByText("Book service"));
  return document.querySelector("div.fixed");
};

describe("SelectService booking modal viewport containment", () => {
  test("opens with the overlay anchored by explicit offsets and above app content", () => {
    const overlay = renderOpen();
    expect(overlay).not.toBeNull();

    // Explicit top/bottom/left/right pin the overlay to the viewport; without
    // them a fixed element falls back to its static flow position.
    expect(overlay.className).toContain("top-0");
    expect(overlay.className).toContain("bottom-0");
    expect(overlay.className).toContain("left-0");
    expect(overlay.className).toContain("right-0");
    // The overlay must paint above page content, not underneath it.
    expect(overlay.className).toContain("z-50");
    // It must actually be visible once opened.
    expect(overlay.className).toContain("block");
    expect(overlay.className).not.toContain("hidden");
  });

  test("keeps the dialog width and height inside the viewport", () => {
    const overlay = renderOpen();
    const card = overlay.querySelector(".bg-white.relative");
    expect(card).toBeInTheDocument();

    // Width: w-full on mobile inside the px-4 padded overlay, so the right
    // edge can never exceed the viewport.
    expect(card.className).toContain("w-full");
    // Height: capped at 60% of the viewport with internal scrolling so a
    // long booking form can never push the card off-screen.
    expect(card.className).toContain("max-h-[60%]");
    expect(card.className).toContain("overflow-y-scroll");
  });

  test("closes by removing the overlay from view", () => {
    renderOpen();
    expect(document.querySelector("div.fixed").className).toContain("block");

    // The close icon sits in the sticky header of the booking dialog.
    fireEvent.click(document.querySelector("img[alt='']"));
    expect(document.querySelector("div.fixed").className).toContain("hidden");
  });
});
