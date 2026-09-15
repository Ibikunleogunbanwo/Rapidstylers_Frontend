import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Humour from "./rapidStylerHumour";

describe("the sidebar quote card", () => {
  const renderCard = () => render(<Humour />);

  test("renders in the design language: hairline card, no gradient, no shadow", () => {
    const { container } = renderCard();

    const card = container.firstElementChild;
    expect(card.className).toContain("border-black/10");
    expect(card.className).toContain("rounded-lg");
    expect(card.className).not.toContain("gradient");
    expect(card.className).not.toContain("shadow");
    // The purple slab had decorative circles; they must not return.
    expect(container.innerHTML).not.toContain("rounded-full bg-white/10");
  });

  test("carries the quote and the tracked uppercase attribution", () => {
    renderCard();

    expect(
      screen.getByText(/can’t buy happiness, but a fresh style comes/)
    ).toBeInTheDocument();
    expect(screen.getByText("RapidStylers")).toHaveClass("tracking-[0.25em]");
  });

  test("does not use an icon or emoji as the card's visual anchor", () => {
    const { container } = renderCard();

    // The old card opened with a 48px scissors-emoji chip.
    expect(container.textContent).not.toContain("✂");
    expect(container.querySelector("h-12 w-12")).toBeNull();
  });
});
