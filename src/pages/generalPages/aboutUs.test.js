import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AboutUs from "./aboutUs";
import { GALLERY_CATEGORIES } from "../../utils/galleryCategories";

// The hero is shared app chrome (redux, formik, the sign-in modals); the footer
// is on every page. Neither is what this test is about.
vi.mock("./heroSection", () => ({ default: () => <div data-testid="hero" /> }));
vi.mock("../../components/footer", () => ({ default: () => <div data-testid="footer" /> }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AboutUs />
    </MemoryRouter>
  );

describe("About page", () => {
  test("uses our own work rather than bundled stock", () => {
    // The page used to carry AI-generated portraits from src/assets. Anything
    // that renders here has to be a reviewed gallery photo.
    const { container } = renderPage();
    const sources = [...container.querySelectorAll("img")].map((img) =>
      img.getAttribute("src")
    );

    expect(sources.length).toBeGreaterThan(0);
    sources.forEach((src) => expect(src).toMatch(/^\/images\/gallery\/g-[a-z0-9-]+\.jpg$/));
  });

  test("every photo is captioned, so it is clear whose work it is", () => {
    const { container } = renderPage();
    const figures = [...container.querySelectorAll("figure")];

    expect(figures.length).toBeGreaterThan(0);
    figures.forEach((figure) => {
      const caption = figure.querySelector("figcaption");
      expect(caption).not.toBeNull();
      expect(caption.textContent.trim().length).toBeGreaterThan(10);
    });
  });

  test("lists every service the gallery covers, each with a line of detail", () => {
    renderPage();

    GALLERY_CATEGORIES.forEach((label) => {
      const item = screen.getByText(label).closest("li");
      expect(item, `${label} is missing from the about page`).not.toBeNull();
      // The label plus its note — a bare label would mean the note map fell out
      // of step with the tab list.
      expect(item.textContent.replace(label, "").trim().length).toBeGreaterThan(4);
    });
  });

  test("sends the two calls to action where the copy says they go", () => {
    renderPage();

    expect(
      screen.getByRole("link", { name: "Register as a beauty professional" }).getAttribute("href")
    ).toBe("/styler-signup");
    expect(screen.getByRole("link", { name: "Browse the gallery" }).getAttribute("href")).toBe(
      "/elevate-your-looks"
    );
    expect(screen.getByRole("link", { name: "Ask us something" }).getAttribute("href")).toBe(
      "/contact-support"
    );
  });

  test("keeps the generic filler out", () => {
    // The page this replaced leaned on empty claims ("Unwavering quality",
    // "Effortless trust", "A thriving community"). They are the thing that made
    // it read as machine-written, so they are pinned out.
    renderPage();

    expect(
      screen.queryByText(/unwavering quality|effortless trust|thriving community|reimagined/i)
    ).not.toBeInTheDocument();
  });
});
