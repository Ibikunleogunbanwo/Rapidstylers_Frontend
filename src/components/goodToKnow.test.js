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
      screen.getByText(/Prices are set by the professional and shown before you confirm/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no hidden per-kilometre charges/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cancel before the appointment starts and your payment is refunded automatically/)
    ).toBeInTheDocument();
    expect(screen.getByText(/one review per completed booking/)).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Read the FAQ" }).getAttribute("href")).toBe(
      "/faqs#for-customers"
    );
  });

  test("styler variant covers commission, payouts and the cancellation window, linking to #for-beauty-professionals", () => {
    renderCard("styler");

    expect(
      screen.getByText(/12% platform commission plus Stripe processing fees are deducted/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Payouts go to your connected Stripe account after an appointment is completed/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/completed booking can only be cancelled within a short window/)
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Read the FAQ" }).getAttribute("href")).toBe(
      "/faqs#for-beauty-professionals"
    );
  });

  test("unknown variant falls back to the customer content", () => {
    renderCard("nope");
    expect(screen.getByText(/Prices are set by the professional/)).toBeInTheDocument();
  });
});
