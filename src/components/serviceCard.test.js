import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ServiceCard from "./serviceCard";

// cloudinaryImage builds transformation URLs from an env-configured cloud name.
vi.mock("../utils/cloudinaryImage", () => ({
  cloudinaryCard: (src) => `card/${src}`,
}));

const renderCard = (props = {}) =>
  render(
    <MemoryRouter>
      <ServiceCard
        name="Braids by Ada"
        rating="4.8"
        reviews="23"
        status="Online"
        stylerId="S1"
        businessName="Braids by Ada"
        {...props}
      />
    </MemoryRouter>
  );

describe("ServiceCard in the page design language", () => {
  test("renders name, rating and reviews as plain text, not chips", () => {
    renderCard();

    expect(screen.getByText("Braids by Ada")).toBeInTheDocument();
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("23 reviews")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  test("the card shell uses the design language: hairline border, no shadow, no hover glow", () => {
    const { container } = renderCard();
    const shell = container.firstElementChild.firstElementChild;

    expect(shell.className).toContain("border-black/10");
    expect(shell.className).not.toMatch(/shadow/);
    expect(shell.className).not.toMatch(/translate-y/);
  });

  test("the photo keeps the editorial 4:5 ratio instead of a fixed crop", () => {
    const { container } = renderCard({ coverImg: "photo.jpg" });
    const frame = container.querySelector(".aspect-\\[4\\/5\\]");

    expect(frame).not.toBeNull();
    const img = frame.querySelector("img");
    expect(img).toHaveAttribute("src", "card/photo.jpg");
    expect(img).toHaveAttribute("alt", "Braids by Ada");
  });

  test("a card without a photo shows quiet initials, not the gradient tile", () => {
    const { container } = renderCard();

    expect(screen.getByText("BB")).toBeInTheDocument();
    expect(container.querySelector(".bg-neutral")).not.toBeNull();
    expect(container.querySelector(".font-serif")).toBeNull();
  });

  test("a card with no rating shows the quiet New label instead of a chip", () => {
    renderCard({ rating: "0", reviews: "0" });

    expect(screen.getByText("New")).toBeInTheDocument();
    expect(screen.queryByText("0 reviews")).not.toBeInTheDocument();
  });

  test("save button toggles through the host's handler and never navigates", () => {
    const onToggleSaved = vi.fn();
    renderCard({ onToggleSaved });

    fireEvent.click(screen.getByRole("button", { name: "Save professional" }));
    expect(onToggleSaved).toHaveBeenCalledWith("S1");
  });

  test("the saved state relabels the button for screen readers", () => {
    renderCard({ isSaved: true, onToggleSaved: vi.fn() });

    expect(
      screen.getByRole("button", { name: "Remove saved professional" })
    ).toBeInTheDocument();
  });

  test("distance renders with units as quiet text", () => {
    renderCard({ distance: 12 });

    expect(screen.getByText("12 km")).toBeInTheDocument();
  });

  test("without a stylerId the card is not a link", () => {
    renderCard({ stylerId: undefined, onToggleSaved: undefined });

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  test("with a stylerId the whole card links to the profile", () => {
    renderCard();

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toContain("/stylistProfile/");
  });

  test("a photo-less card with a known service shows that field's curated photo, alt described as a sample", () => {
    const { container } = renderCard({ serviceTypeName: "Barber", name: "Fresh Cuts YYC" });

    const img = container.querySelector("img[class*='object-cover']");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).toMatch(/^\/images\/gallery\//);
    expect(img.getAttribute("alt")).toMatch(/sample/i);
    expect(screen.queryByText("FC")).not.toBeInTheDocument();
  });

  test("the curated fallback renders inside the same 4:5 frame and never a cloudinary URL", () => {
    const { container } = renderCard({ serviceTypeName: "Nail Technician" });
    const frame = container.querySelector(".aspect-\\[4\\/5\\]");
    const img = frame.querySelector("img");

    expect(frame).not.toBeNull();
    expect(img.getAttribute("src")).not.toContain("card/");
  });

  test("initials remain the last resort when the service type is unrecognised", () => {
    renderCard({ serviceTypeName: "Tarot Reading", name: "Mystery Studio" });

    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  test("initials remain when no service type is passed at all", () => {
    renderCard({ serviceTypeName: undefined });

    expect(screen.getByText("BB")).toBeInTheDocument();
  });

  test("a failed stylist photo falls back to the curated sample, not initials", () => {
    const { container } = renderCard({ coverImg: "broken.jpg", serviceTypeName: "Makeup Artist" });

    const img = container.querySelector("img[class*='object-cover']");
    fireEvent.error(img);

    expect(container.querySelector("img[class*='object-cover']").getAttribute("src")).toMatch(/^\/images\/gallery\//);
  });
});
