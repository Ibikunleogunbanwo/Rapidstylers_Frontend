import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactSupport, { supportTicketTarget } from "./contactSupport";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
  setAuthToken,
  setUserRole,
  getIntendedRoute,
} from "../../utils/constant";
// The shared site header needs the app's store; these tests are about the page body.
vi.mock("../../components/publicHeader", () => ({ default: () => null }));


/**
 * The support page is where a stuck customer looks for a human. Every contact
 * value it shows must come from the shared constants, because publishing a
 * retyped copy is how the site once advertised a phone number that did not
 * exist and an email on a domain nobody owned. These tests pin the constants
 * and reject the known-stale values.
 */
vi.mock("../../components/footer", () => ({ default: () => <footer data-testid="footer" /> }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ContactSupport />
    </MemoryRouter>
  );

describe("Contact support page", () => {
  test("offers the shared email address as a mailto link", () => {
    renderPage();

    const mail = screen.getAllByRole("link", { name: /email us/i })[0];
    expect(mail.getAttribute("href")).toBe(`mailto:${SUPPORT_EMAIL}`);
    expect(screen.getByText(new RegExp(`Write to us at ${SUPPORT_EMAIL}`))).toBeInTheDocument();
  });

  test("offers the shared phone number as a tel link", () => {
    renderPage();

    const phone = screen.getByRole("link", { name: /call us/i });
    expect(phone.getAttribute("href")).toBe(`tel:${SUPPORT_PHONE_TEL}`);
    expect(screen.getByText(SUPPORT_PHONE, { exact: false })).toBeInTheDocument();
  });

  test("publishes no placeholder or stale contact value", () => {
    const { container } = renderPage();
    const text = container.textContent;

    expect(text).not.toMatch(/@rapidstylers\.com\b/i);
    expect(text).not.toMatch(/\+?1?[\s.-]?\(?234\)?[\s.-]?567[\s.-]?890/);
    expect(text).not.toMatch(/\b555[-.\s]?\d{3,4}\b/);
    expect(text).not.toMatch(/123 style street/i);
  });
});

describe("Support ticket link follows the visitor's role", () => {
  afterEach(() => sessionStorage.clear());
  const ticketLink = () => screen.getByRole("link", { name: /submit a support ticket/i });

  test("a signed-in professional goes to their dashboard's support screen", () => {
    setAuthToken("token");
    setUserRole("STYLER");
    renderPage();
    expect(ticketLink()).toHaveAttribute("href", "/styler-dashboard/support");
  });

  test("a signed-in customer goes to customer support", () => {
    setAuthToken("token");
    setUserRole("CUSTOMER");
    renderPage();
    expect(ticketLink()).toHaveAttribute("href", "/support");
  });

  test("a signed-out visitor signs in first, with a return to support", () => {
    renderPage();
    const link = ticketLink();
    expect(link).toHaveAttribute("href", "/login");
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(getIntendedRoute()).toBe("/support");
  });

  test("the target helper covers each case", () => {
    expect(supportTicketTarget("", "")).toMatchObject({ href: "/login", returnTo: "/support" });
    expect(supportTicketTarget("t", "STYLER").href).toBe("/styler-dashboard/support");
    expect(supportTicketTarget("t", "CUSTOMER").href).toBe("/support");
    expect(supportTicketTarget("t", "").href).toBe("/support");
  });
});
