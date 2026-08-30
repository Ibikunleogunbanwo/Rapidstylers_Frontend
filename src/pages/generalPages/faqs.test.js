import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Faqs from "./faqs";

// The page renders a Home <Link>, which requires a Router context.
const renderFaqs = () =>
  render(
    <MemoryRouter>
      <Faqs />
    </MemoryRouter>
  );

// The FAQ page is what we're testing — stub the heavy footer chrome so the
// test stays focused on the accordion content.
jest.mock("../../components/footer", () => () => <div data-testid="footer" />);

// The page scrolls on mount; jsdom doesn't implement it.
beforeEach(() => {
  window.scrollTo = jest.fn();
  window.scrollIntoView = jest.fn();
});

const QUESTIONS = [
  "How do I book an appointment?",
  "Do I need an account to book?",
  "What does an appointment cost?",
  "How do payments work?",
  "Can I cancel an appointment and get a refund?",
  "How do reviews work?",
  "How do I find a professional?",
  "What if something goes wrong with my appointment?",
  "How do I become a beauty professional on RapidStylers?",
  "How do clients book me?",
  "How do I price my services?",
  "When and how do I get paid?",
  "What fees does RapidStylers charge?",
  "What do I need to receive payouts?",
  "Can I cancel an appointment I have accepted?",
  "How do I sign in?",
  "I did not get my verification code. What should I do?",
  "How is my account protected?",
  "Forgot your password?",
];

describe("FAQs page", () => {
  test("renders all three section headings with deep-link anchors", () => {
    renderFaqs();

    // The category headings carry the deep-link anchors the footer points at.
    expect(screen.getByText("For customers").id).toBe("for-customers");
    expect(screen.getByText("For beauty professionals").id).toBe("for-beauty-professionals");
    expect(screen.getByText("Accounts & security").id).toBe("accounts-security");
  });

  test("renders every FAQ question", () => {
    renderFaqs();

    QUESTIONS.forEach((q) => {
      expect(screen.getByRole("button", { name: q })).toBeInTheDocument();
    });
  });

  test("shows the first answer open by default", () => {
    renderFaqs();

    expect(
      screen.getByText(/The professional reviews your request — including your location and travel distance/)
    ).toBeInTheDocument();
  });

  test("customer pricing answer explains the professional-set price and flat travel fee", () => {
    renderFaqs();

    fireEvent.click(screen.getByRole("button", { name: "What does an appointment cost?" }));
    expect(
      screen.getByText(/The price is set by the professional and shown to you before you confirm/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/optional flat home-visit fee for travelling to you/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/no hidden per-kilometre charges/)
    ).toBeInTheDocument();
  });

  test("professional pricing answer covers the flat travel fee, not per-km", () => {
    renderFaqs();

    fireEvent.click(screen.getByRole("button", { name: "How do I price my services?" }));
    expect(
      screen.getByText(/optional flat home-visit fee for travelling to clients/)
    ).toBeInTheDocument();
    expect(screen.getByText(/not a per-kilometre charge/)).toBeInTheDocument();
  });

  test("payout answer shows the 12% commission and Stripe fee breakdown", () => {
    renderFaqs();

    fireEvent.click(screen.getByRole("button", { name: "What fees does RapidStylers charge?" }));
    expect(screen.getByText(/12% platform commission/)).toBeInTheDocument();
    expect(screen.getByText(/Stripe's processing fees/)).toBeInTheDocument();
    expect(screen.getByText(/before the payout is sent to your connected account/)).toBeInTheDocument();
  });

  test("payout timing answer mentions Stripe Connect and the standard schedule", () => {
    renderFaqs();

    fireEvent.click(screen.getByRole("button", { name: "When and how do I get paid?" }));
    expect(screen.getByText(/Stripe Connect to your connected account/)).toBeInTheDocument();
    expect(screen.getByText(/Stripe's standard payout schedule/)).toBeInTheDocument();
  });

  test("refund answer explains automatic refunds and visible status", () => {
    renderFaqs();

    fireEvent.click(screen.getByRole("button", { name: "Can I cancel an appointment and get a refund?" }));
    expect(screen.getByText(/refunded automatically/)).toBeInTheDocument();
    expect(screen.getByText(/status shows on the booking/)).toBeInTheDocument();
  });

  test("an open answer closes when its question is clicked again", () => {
    renderFaqs();

    const button = screen.getByRole("button", { name: "What does an appointment cost?" });
    fireEvent.click(button);
    expect(screen.getByText(/no hidden per-kilometre charges/)).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.queryByText(/no hidden per-kilometre charges/)).not.toBeInTheDocument();
  });

  test("renders the Home link and footer", () => {
    renderFaqs();

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});
