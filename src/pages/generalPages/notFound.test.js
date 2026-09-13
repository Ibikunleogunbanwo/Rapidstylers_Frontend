import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "./notFound";
import {
  SUPPORT_ADDRESS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_TEL,
} from "../../utils/constant";

/**
 * The 404 page is often the first page a mistyped URL shows, so it carries the
 * same contact block as the footer. These tests pin that its values come from
 * the shared constants and never from a retyped stale copy.
 */
const renderPage = () =>
  render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );

describe("404 page contact block", () => {
  test("links the shared email and phone", () => {
    renderPage();

    expect(screen.getByRole("link", { name: SUPPORT_EMAIL }).getAttribute("href")).toBe(
      `mailto:${SUPPORT_EMAIL}`
    );
    expect(screen.getByRole("link", { name: SUPPORT_PHONE }).getAttribute("href")).toBe(
      `tel:${SUPPORT_PHONE_TEL}`
    );
  });

  test("shows the shared address", () => {
    renderPage();

    expect(screen.getByText(SUPPORT_ADDRESS)).toBeInTheDocument();
  });

  test("publishes no placeholder or stale contact value", () => {
    const { container } = renderPage();
    const text = container.textContent;

    expect(text).not.toMatch(/@rapidstylers\.com\b/i);
    expect(text).not.toMatch(/\+?1?[\s.-]?\(?234\)?[\s.-]?567[\s.-]?890/);
    expect(text).not.toMatch(/123 style street/i);
  });
});
