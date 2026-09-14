import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GoodToKnow from "./goodToKnow";

const renderCard = (variant) =>
  render(
    <MemoryRouter>
      <GoodToKnow variant={variant} />
    </MemoryRouter>
  );

describe("GoodToKnow card", () => {
  test("customer variant covers pricing, refunds and reviews, linking to #for-customers", () => {
    renderCard("customer");

    expect(screen.getByText("Good to know")).toBeInTheDocument();
    expect(
      screen.getByText(/see the full amount before you confirm/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Some add a flat fee for home visits/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/payment is refunded automatically/)
    ).toBeInTheDocument();
    expect(screen.getByText(/one review for each completed booking/)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Read the FAQ" }).getAttribute("href")).toBe(
      "/faqs#for-customers"
    );
  });

  test("styler variant covers commission, payouts and the cancellation window, linking to #for-beauty-professionals", () => {
    renderCard("styler");

    expect(
      screen.getByText(/12% platform commission and Stripe's processing fees/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/land in your connected Stripe account/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/see how far away the client is before you accept/)
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Read the FAQ" }).getAttribute("href")).toBe(
      "/faqs#for-beauty-professionals"
    );
  });

  test("unknown variant falls back to the customer content", () => {
    renderCard("nope");
    expect(screen.getByText(/see the full amount before you confirm/)).toBeInTheDocument();
  });

  test("reads as a hairline card: no wash, no shadow, no check icons", () => {
    const { container } = renderCard("customer");
    const card = container.firstChild;
    expect(card.className).toMatch(/border-black\/10/);
    expect(card.className).not.toMatch(/shadow/);
    expect(card.className).not.toMatch(/faf9ff/);
    expect(card.className).not.toMatch(/rounded-2xl/);
    // The old design stamped a purple check on every line; the register uses
    // plain hairline rows with no per-item icon.
    expect(container.querySelectorAll("svg").length).toBe(0);
  });
});
