import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Advert from "./advert";

describe("the sidebar advert card", () => {
  const renderCard = () =>
    render(
      <MemoryRouter>
        <Advert />
      </MemoryRouter>
    );

  test("renders in the design language: hairline card, no dark slab, no shadow", () => {
    const { container } = renderCard();

    const card = container.firstElementChild;
    expect(card.className).toContain("border-black/10");
    expect(card.className).toContain("bg-white");
    expect(card.className).not.toContain("shadow");
    // The old card's hardcoded dark ground and its hex washes must not return.
    expect(container.innerHTML).not.toContain("1d1d1d");
    expect(container.innerHTML).not.toContain("9381ff");
  });

  test("uses the bundled local photo, not the expired freepik hotlink", () => {
    const { container } = renderCard();

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img.getAttribute("src")).not.toContain("freepik");
    expect(img.getAttribute("src")).toMatch(/barbers/);
    // The 4:3 frame keeps the card's height predictable in the sidebar.
    expect(img.className).toContain("aspect-[4/3]");
  });

  test("keeps the booking message and one solid-brand pill CTA", () => {
    renderCard();

    expect(screen.getByText(/top beauty professionals near you/)).toBeInTheDocument();
    const cta = screen.getByRole("link", { name: "Book now" });
    expect(cta).toHaveAttribute("href", "/bookAppointment");
    expect(cta.className).toContain("rounded-full bg-brand");
    // The old white-on-dark rectangle is gone.
    expect(cta.className).not.toContain("bg-white");
  });
});
