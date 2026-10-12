import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Faqs, { groupFaqSections, slugFor } from "./faqs";

// Published FAQ content from the admin; null (nothing published) unless a test
// installs some, which is also what the page sees when the request fails.
const published = vi.hoisted(() => ({ current: null }));
vi.mock("../../hooks/remote/usePublishedContent", () => ({
  usePublishedContent: () => published.current,
}));
// The shared site header needs the app's store; these tests are about the page body.
vi.mock("../../components/publicHeader", () => ({ default: () => null }));


// The page renders a Home <Link>, which requires a Router context.
const renderFaqs = () =>
  render(
    <MemoryRouter>
      <Faqs />
    </MemoryRouter>
  );

// The FAQ page is what we're testing — stub the heavy footer chrome so the
// test stays focused on the accordion content.
vi.mock("../../components/footer", () => ({ default: () => <div data-testid="footer" /> }));

// The page scrolls on mount; jsdom doesn't implement it.
beforeEach(() => {
  window.scrollTo = vi.fn();
  window.scrollIntoView = vi.fn();
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

    // The category sections carry the deep-link anchors the footer points at.
    expect(document.getElementById("for-customers")).not.toBeNull();
    expect(document.getElementById("for-beauty-professionals")).not.toBeNull();
    expect(document.getElementById("accounts-security")).not.toBeNull();
    // ...and each wraps its own questions.
    expect(
      document.getElementById("for-customers").textContent
    ).toContain("How do I book an appointment?");
    expect(
      document.getElementById("accounts-security").textContent
    ).toContain("Forgot your password?");
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
      screen.getByText(/The professional reviews your request, including your location and travel distance/)
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

  test("renders the back link and footer", () => {
    renderFaqs();

    expect(screen.getByRole("link", { name: "Back home" })).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });
});

describe("FAQ sections from published content", () => {
  const scrolled = [];
  beforeEach(() => {
    published.current = null;
    scrolled.length = 0;
    Element.prototype.scrollIntoView = vi.fn(function scrollIntoView() {
      scrolled.push(this.id);
    });
  });
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  const interleaved = {
    items: [
      { question: "What is RapidStylers?", answer: "A marketplace.", category: "General" },
      { question: "How do I book?", answer: "Pick a time.", category: "Booking" },
      { question: "Is it free to join?", answer: "Yes.", category: "General" },
      { question: "Can I rebook?", answer: "Any time.", category: "Booking!" },
    ],
  };

  test("groups every item of a category into one section, in first-seen order", () => {
    const sections = groupFaqSections(interleaved.items.map((i) => ({ q: i.question, a: i.answer, category: i.category })));
    expect(sections.map((s) => s.category)).toEqual(["General", "Booking", "Booking!"]);
    expect(sections[0].items.map((i) => i.q)).toEqual(["What is RapidStylers?", "Is it free to join?"]);
  });

  test("labels that fold to the same slug still get distinct ids", () => {
    const sections = groupFaqSections([
      { q: "a", category: "Booking" },
      { q: "b", category: "Booking!" },
      { q: "c", category: " booking " },
      { q: "d", category: "" },
      { q: "e", category: "Réservation" },
      { q: "f", category: "???" },
    ]);
    expect(sections.map((s) => s.id)).toEqual(["booking", "booking-2", "booking-3", "general", "reservation", "section"]);
    expect(slugFor("Accounts & security")).toBe("accounts-security");
  });

  test("answers keep stable, unique keys even when questions repeat", () => {
    const sections = groupFaqSections([
      { q: "Same?", category: "General" },
      { q: "Same?", category: "General" },
      { id: 42, q: "Has id", category: "Booking" },
    ]);
    expect(sections[0].items.map((i) => i.key)).toEqual(["faq-at-0", "faq-at-1"]);
    expect(sections[1].items[0].key).toBe("faq-42");
  });

  test("the page renders one section per category with no duplicate ids", () => {
    published.current = interleaved;
    renderFaqs();
    const ids = [...document.querySelectorAll("section[id]")].map((el) => el.id);
    expect(ids).toEqual(["general", "booking", "booking-2"]);
    expect(document.getElementById("general").textContent).toContain("Is it free to join?");
    expect(document.getElementById("booking-2").textContent).toContain("Can I rebook?");
  });

  test("a deep link scrolls to its section once published content arrives", async () => {
    window.history.replaceState(null, "", "/faqs#booking-2");
    const view = renderFaqs();
    expect(document.getElementById("booking-2")).toBeNull();

    published.current = interleaved;
    view.rerender(
      <MemoryRouter>
        <Faqs />
      </MemoryRouter>
    );
    await waitFor(() => expect(scrolled).toEqual(["booking-2"]));
  });

  test("a hash change on the page scrolls to the matching section", async () => {
    published.current = interleaved;
    renderFaqs();
    window.history.replaceState(null, "", "/faqs#general");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    await waitFor(() => expect(scrolled).toContain("general"));
  });
});
