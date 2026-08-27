import { render, screen, fireEvent, within } from "@testing-library/react";
import ElevateLooks from "./elevateYourLooks";
import { APIService } from "../../hooks/remote/apiService";

// The gallery page is what we're testing — stub the heavy chrome (Hero pulls in
// redux/router/formik/video assets) and the ad slot, keeping the test focused.
jest.mock("./newHeroSection", () => () => <div data-testid="hero" />);
jest.mock("../../components/footer", () => () => <div data-testid="footer" />);
jest.mock("../../components/adSlot", () => () => null);

// react-scripts resets mock implementations between tests, so the factory only
// declares the shape and values are wired in beforeEach (see apiService.test.js).
jest.mock("../../hooks/remote/apiService", () => ({
  APIService: { searchGallery: jest.fn() },
}));

// Shape returned by the backend /gallery endpoint for an approved stylist's upload.
const PHOTO = {
  src: {
    medium: "https://img.example/medium.jpg",
    large: "https://img.example/large.jpg",
    original: "https://img.example/original.jpg",
  },
  alt: "Gallery Pro Studio — dreadlocks",
  photographer: "Gallery Pro Studio",
  stylerId: "GS5816",
  source: "stylist",
};

describe("ElevateLooks gallery cards", () => {
  beforeEach(() => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [PHOTO] } });
  });

  test("renders a profile link per stylist card with the encoded route", async () => {
    render(<ElevateLooks />);

    const link = await screen.findByRole("link", {
      name: "View Gallery Pro Studio's profile",
    });
    expect(link.getAttribute("href")).toBe(
      `/stylistProfile/${btoa("GS5816")}/${btoa("Gallery Pro Studio")}`
    );

    // The verified badge and the By credit both live inside the same card link.
    expect(within(link).getByText("Verified")).toBeInTheDocument();
    expect(within(link).getByText(/Gallery Pro Studio/)).toBeInTheDocument();
  });

  test("renders an expand button per stylist card", async () => {
    render(<ElevateLooks />);

    const expand = await screen.findByRole("button", {
      name: "View Gallery Pro Studio — dreadlocks full size",
    });
    expect(expand).toBeInTheDocument();
  });

  test("opens the lightbox from the expand button with the work credit", async () => {
    render(<ElevateLooks />);

    const expand = await screen.findByRole("button", {
      name: "View Gallery Pro Studio — dreadlocks full size",
    });
    fireEvent.click(expand);

    const dialog = await screen.findByRole("dialog", {
      name: "Gallery Pro Studio — dreadlocks full view",
    });
    expect(within(dialog).getByText(/Work by/)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: "Book with Gallery Pro Studio" })
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "View profile" })).toBeInTheDocument();

    // Closing the lightbox restores the page.
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("shows the empty state when a category without curated work has no uploads", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    // Wait for the first (curated) view to settle before switching, so the
    // category change runs against the populated grid.
    await screen.findByRole("button", { name: "View Professional makeup application" });
    fireEvent.click(screen.getByRole("button", { name: "Wigs" }));

    expect(
      await screen.findByText("No Wigs work posted yet")
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /profile$/ })).not.toBeInTheDocument();
  });

  test("leads the first view with curated RapidStylers work", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    expect(
      await screen.findByRole("button", { name: "View Professional makeup application" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View Precision barber trim" })
    ).toBeInTheDocument();
  });

  test("filters curated work to the selected category", async () => {
    APIService.searchGallery.mockResolvedValue({ data: { data: [] } });
    render(<ElevateLooks />);

    await screen.findByRole("button", { name: "View Professional makeup application" });
    fireEvent.click(screen.getByRole("button", { name: "Braids" }));

    expect(
      await screen.findByRole("button", { name: "View Hair braiding" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View Professional makeup application" })
    ).not.toBeInTheDocument();
  });
});
