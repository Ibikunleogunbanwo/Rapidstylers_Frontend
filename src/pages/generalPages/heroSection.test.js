import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Hero from "./heroSection";

/**
 * The About hero is the variant this file covers. `aboutUs.test.js` stubs the
 * hero out (it pulls in the whole app chrome), so the statement a visitor
 * actually reads at the top of /about had no test of its own until now.
 *
 * The rest of the hero — redux, formik, the sign-in and sign-up modals — is
 * stubbed rather than exercised; that is app chrome, not this page's copy.
 */
vi.mock("react-redux", () => ({
  // Hero reads it as `useSelector((state) => state.user).loading`, so the
  // selector is really invoked against a minimal slice.
  useSelector: vi.fn((select) => select({ user: { loading: false, error: null } })),
  useDispatch: vi.fn(() => vi.fn()),
}));
vi.mock("../../hooks/local/userReducer", () => ({
  getUserDetails: vi.fn(),
  setUserSession: vi.fn(),
  userAuthenticate: vi.fn(),
  verifySignUpEmailAddress: vi.fn(),
}));
vi.mock("../../components/searchForStyler", () => ({ default: () => null }));
vi.mock("../../components/googleSignInButton", () => ({ default: () => null }));
vi.mock("../../components/button", () => ({ default: () => null }));
vi.mock("../../components/inputWithLabel", () => ({ default: () => null }));
vi.mock("../../components/passwordInput", () => ({ default: () => null }));
vi.mock("../../components/modals", () => ({ default: () => null }));
vi.mock("../../components/spinner", () => ({ default: () => null }));

const renderHero = () =>
  render(
    <MemoryRouter>
      <Hero height="600px" />
    </MemoryRouter>
  );

describe("About hero", () => {
  beforeEach(() => {
    // Hero chooses its variant from the document title, which AboutUs sets
    // before it renders its children.
    document.title = "About us | RapidStylers";
  });

  afterEach(() => {
    document.title = "";
  });

  test("says what the product does, not just how it feels", () => {
    renderHero();

    expect(screen.getByText("About RapidStylers")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1 }).textContent
    ).toMatch(/say goodbye to the salon struggle/i);
    // The promise is followed by the mechanism: how a booking actually happens.
    expect(screen.getByText(/book a time that suits you/i)).toBeInTheDocument();
  });

  test("leaves no dash standing in for punctuation", () => {
    renderHero();

    // The eyebrow, the statement and the paragraph share one wrapper, so this
    // covers the whole hero block the visitor reads.
    const block = screen.getByRole("heading", { level: 1 }).parentElement;

    expect(block.textContent).not.toMatch(/[\u2012\u2013\u2014\u2015]/);
  });
});
