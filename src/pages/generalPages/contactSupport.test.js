import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ContactSupport from "./contactSupport";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../../utils/constant";

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
