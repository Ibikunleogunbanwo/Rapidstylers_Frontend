import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LandingPage from "./landing";

/**
 * The home page is the one surface the design-system pass has not been applied
 * to. It went wrong once already: the "benefits for clients" section lost both
 * its `bg-black` and its two-column grid, so its `text-white` copy rendered
 * invisible against the page and the photo it pairs with stretched into a
 * full-width band. Neither failure is visible to a type check or an assertion
 * about copy, so the pairing is pinned here instead.
 *
 * The chrome the home page pulls in (the hero with its store, the featured
 * carousel, the blog feed) is stubbed — this file is about layout, not those.
 */
vi.mock("./newHeroSection", () => ({ default: () => <div data-testid="hero" /> }));
vi.mock("../../components/featuredStylists", () => ({ default: () => null }));
vi.mock("../../components/img-slider", () => ({ default: () => null }));
vi.mock("../../components/adSlot", () => ({ default: () => null }));
vi.mock("../../components/footer", () => ({ default: () => null }));
vi.mock("../../hooks/remote/apiService", () => ({
  // Deliberately never settles: this file is about layout, and a resolved blog
  // fetch would only add an act() warning about state nobody here asserts on.
  APIService: { listBlog: vi.fn(() => new Promise(() => {})) },
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );

/** Backgrounds that count as a surface white text can sit on. */
const isSurface = (cls) => {
  if (!cls.startsWith("bg-")) return false;
  const light = /^bg-(white|neutral(-|$)|gray-(50|100|200)|slate-(50|100|200)|zinc-(50|100|200))/;
  return !light.test(cls);
};

describe("Home page layout", () => {
  test("the clients benefits section keeps the dark surface its white copy needs", () => {
    renderHome();

    const heading = screen.getByText("Why choose RapidStylers?");
    const section = heading.closest(".bg-black");

    expect(section, "the section lost its dark background").not.toBeNull();
    // The photo and the copy must stay side by side; stacking them full-width is
    // what made the image read as a distorted band.
    expect(section.className).toMatch(/lg:grid-cols-2/);
    // And the white copy is exactly why the background is load-bearing.
    expect(section.querySelectorAll(".text-white").length).toBeGreaterThan(0);
  });

  test("no white text is left sitting on a light page", () => {
    renderHome();

    const lightText = [...document.querySelectorAll('.text-white, [class*="text-white/"]')];
    expect(lightText.length).toBeGreaterThan(0);

    const stranded = lightText.filter((el) => {
      for (let node = el; node && node !== document.body; node = node.parentElement) {
        if ([...node.classList].some(isSurface)) return false;
      }
      return true;
    });

    expect(
      stranded.map((el) => `${el.tagName}.${el.className}`),
      "white text needs a dark surface somewhere above it"
    ).toEqual([]);
  });

  test("the clients card shows our own barbering photo", () => {
    renderHome();

    // It used to be stylist-1.jpg, the same braiding close-up as the gallery's
    // natural-hair tile, which cut the forehead at the card's crop.
    expect(
      screen
        .getByAltText("A client in the chair while a barber finishes their cut")
        .getAttribute("src")
    ).toMatch(/barbers/);
  });

  test("the brand story shows our own work, not a bundled stock photo", () => {
    const { container } = renderHome();

    const photo = screen.getByAltText("Lash extension close-up");

    // Resolved through the curated list, so it is a reviewed photo of ours and
    // the file is guaranteed to exist (curatedById throws otherwise).
    expect(photo.getAttribute("src")).toMatch(/^\/images\/gallery\/g-[a-z0-9-]+\.jpg$/);
    // The asset it replaced was a close-up that belonged to nobody.
    expect(
      [...container.querySelectorAll("img")].map((i) => i.getAttribute("src")),
      "the bundled stock close-up is still on the page"
    ).not.toContain(expect.stringContaining("about-landing"));
  });

  test("the brand story reads as plain sentences, with no dashes", () => {
    renderHome();

    // It used to be three sentences of rhetorical questions ("Sound familiar?",
    // "what if there was a better way?") that told a reader nothing. The copy now
    // states what the platform does, so both the questions and the em dashes are
    // pinned out.
    const block = screen.getByText(/We are a Canadian booking platform/i).closest("div");

    expect(block.textContent).not.toMatch(/[\u2012\u2013\u2014\u2015]/);
    expect(block.textContent).not.toMatch(
      /sound familiar|what if|slipping out of reach|feels like a luxury|salon struggle/i
    );
  });
});
