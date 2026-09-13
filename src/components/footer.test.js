import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./footer";
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../utils/constant";

/**
 * The footer is on every page, and its contact block is the one place a visitor
 * looks for a human. It previously carried an invented address ("123 Style
 * Street, Fashion District"), a phone number that does not exist
 * ("+1 (234) 567-890") and an email on a domain we do not own
 * (contact@rapidstylers.com) — all of which read as content but cannot be used.
 * These tests pin what is allowed to be there.
 *
 * Redux and the logout thunk are stubbed: this file is about what we publish,
 * not about the newsletter form or the session-dependent links.
 */
vi.mock("react-redux", () => ({
  useSelector: vi.fn(() => null),
  useDispatch: vi.fn(() => vi.fn()),
}));
vi.mock("../hooks/local/userReducer", () => ({ userLogOut: vi.fn() }));

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe("Footer contact details", () => {
  test("shows the support address we actually monitor", () => {
    renderFooter();

    const link = screen.getByRole("link", { name: SUPPORT_EMAIL });

    expect(link.getAttribute("href")).toBe(`mailto:${SUPPORT_EMAIL}`);
    expect(SUPPORT_EMAIL).toBe("support@rapidstylers.ca");
  });

  test("publishes the real address and phone number as links", () => {
    renderFooter();

    expect(screen.getByText(SUPPORT_ADDRESS)).toBeInTheDocument();

    const phone = screen.getByRole("link", { name: SUPPORT_PHONE });
    expect(phone.getAttribute("href")).toBe(`tel:${SUPPORT_PHONE_TEL}`);
    expect(SUPPORT_PHONE_TEL).toMatch(/^\+1\d{10}$/);
    expect(SUPPORT_PHONE).toContain("639) 384-0942");
  });

  test("publishes no placeholder address, phone number or domain", () => {
    const { container } = renderFooter();
    const text = container.textContent;

    // An address with a street number we have never had.
    expect(text).not.toMatch(/\d+\s+(style|main|maple)\s+(street|st\b|avenue|ave\b|road|rd\b)/i);
    // The reserved fictional-number pattern, and the placeholder that shipped.
    expect(text).not.toMatch(/\b555[-.\s]?\d{3,4}\b/);
    expect(text).not.toMatch(/\+?1?[\s.-]?\(?234\)?[\s.-]?567[\s.-]?890/);
    // A domain we do not own: everything published must be on rapidstylers.ca.
    expect(container.querySelectorAll('a[href^="mailto:"]')).toHaveLength(1);
    expect(text).not.toMatch(/@rapidstylers\.com\b/i);
  });
});
