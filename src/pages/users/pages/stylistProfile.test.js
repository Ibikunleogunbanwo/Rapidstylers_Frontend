import { render, screen, fireEvent, within } from "@testing-library/react";
import StylistProfile from "./stylistProfile";
// Resolves to the vi.mock() below (hoisted).
import { APIService } from "../../../hooks/remote/apiService";

vi.mock("react-router-dom", () => ({
  useParams: () => ({ stylerId: btoa("S1"), stylerName: btoa("Pro One") }),
  // BackHome and Footer render Links; pageSections and SectionPager stay real.
  Link: ({ to, children }) => <a href={to}>{children}</a>,
}));
vi.mock("../userLayout/functionalEffects", () => ({
  useSingleStylerProfile: vi.fn(),
}));
vi.mock("react-redux", () => ({
  useSelector: () => ({ loading: false }),
  useDispatch: () => vi.fn(),
}));
vi.mock("../../../components/spinner", () => ({ default: () => null }));
vi.mock("../../../components/footer", () => ({ default: () => <footer data-testid="footer" /> }));
vi.mock("../../../components/goBack", () => ({ default: () => <div data-testid="back" /> }));
vi.mock("../../../components/selectService", () => ({ default: () => null }));
vi.mock("../../../utils/constant", () => ({
  // Mirror the real implementations' sessionStorage behavior so tests can
  // drive signed-in/role state by seeding storage directly.
  getAuthToken: () => sessionStorage.getItem("rapidstylers_auth_token"),
  getUserRole: () => sessionStorage.getItem("rapidstylers_user_role") || "",
  showErrorToastMessage: vi.fn(),
  showSuccessToastMessage: vi.fn(),
  // userReducer is in this page's import graph and evaluates
  // retrieveFromLocalStorage(...) at module scope (initialState).
  retrieveFromLocalStorage: () => ({}),
  setAuthToken: vi.fn(),
  setRefreshToken: vi.fn(),
  setUserRole: vi.fn(),
  clearAllSessionTokens: vi.fn(),
  getRefreshToken: () => null,
}));
vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { listSavedStylists: vi.fn(), saveStylist: vi.fn(), removeSavedStylist: vi.fn() },
}));

import { useSingleStylerProfile } from "../userLayout/functionalEffects";

const portfolio = (n) =>
  Array.from({ length: n }, (_, i) => ({ imageUrl: `https://img.example/${i}.jpg`, name: `img-${i + 1}` }));
const reviews = (n) =>
  Array.from({ length: n }, (_, i) => ({
    userName: `User ${i + 1}`,
    ratingScore: "5",
    message: `msg-${i + 1}`,
  }));

const renderProfile = (overrides = {}) => {
  useSingleStylerProfile.mockReturnValue({
    stylerInformation: { reviewCount: 6, averageRating: "4.5", payoutReady: true },
    stylerPortfolio: portfolio(12),
    stylerReviews: reviews(6),
    availability: [],
    stylerSubService: [],
    ...overrides,
  });
  return render(
    <StylistProfile />
  );
};

describe("StylistProfile portfolio + reviews pagination", () => {
  test("paginates the portfolio at 9 per page", () => {
    renderProfile();

    // Page 1 shows 9 of 12 images, labeled with the visible range.
    expect(screen.getAllByAltText(/^img-/)).toHaveLength(9);
    expect(screen.getByText("Showing 1–9 of 12")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(screen.getAllByAltText(/^img-/)).toHaveLength(3);
    expect(screen.getByText("Showing 10–12 of 12")).toBeInTheDocument();
    expect(screen.getByAltText("img-12")).toBeInTheDocument();
  });

  test("paginates the reviews at 5 per page", () => {
    renderProfile();

    // Page 1 shows 5 of 6 reviews, labeled with the visible range.
    expect(screen.getAllByText(/^msg-/)).toHaveLength(5);
    expect(screen.getByText("User 1")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–5 of 6")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[1]);
    expect(screen.getAllByText(/^msg-/)).toHaveLength(1);
    expect(screen.getByText("msg-6")).toBeInTheDocument();
    expect(screen.getByText("User 6")).toBeInTheDocument();
    expect(screen.getByText("Showing 6–6 of 6")).toBeInTheDocument();
  });

  test("hides the pager when a section fits on one page", () => {
    renderProfile({
      stylerPortfolio: portfolio(5),
      stylerReviews: reviews(3),
    });

    expect(screen.getAllByAltText(/^img-/)).toHaveLength(5);
    expect(screen.getAllByText(/^msg-/)).toHaveLength(3);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  test("opens the lightbox full-size when a portfolio photo is clicked", () => {
    renderProfile();

    // Click the third photo on page 1.
    fireEvent.click(screen.getAllByAltText(/^img-/)[2]);
    const dialog = screen.getByRole("dialog", { name: "Portfolio photo viewer" });
    expect(within(dialog).getByAltText("img-3")).toBeInTheDocument();
    expect(within(dialog).getByText("3 / 12")).toBeInTheDocument();
  });

  test("lightbox next/prev navigates across the whole set and wraps around", () => {
    renderProfile();

    // Open the last photo on page 1 (index 8).
    fireEvent.click(screen.getAllByAltText(/^img-/)[8]);
    let dialog = screen.getByRole("dialog", { name: "Portfolio photo viewer" });
    expect(within(dialog).getByText("9 / 12")).toBeInTheDocument();

    // Next crosses into page 2's first photo without changing the gallery page.
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    dialog = screen.getByRole("dialog", { name: "Portfolio photo viewer" });
    expect(within(dialog).getByAltText("img-10")).toBeInTheDocument();
    expect(within(dialog).getByText("10 / 12")).toBeInTheDocument();
    // The gallery underneath is still on page 1 (only the thumbnails).
    const galleryThumbs = screen
      .getAllByAltText(/^img-/)
      .filter((el) => el.className.includes("aspect-square"));
    expect(galleryThumbs).toHaveLength(9);
    expect(galleryThumbs[8]).toHaveAttribute("alt", "img-9");

    // Prev goes back.
    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));
    expect(within(screen.getByRole("dialog")).getByAltText("img-9")).toBeInTheDocument();

    // Wrap around: next from the last photo lands on the first.
    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(within(screen.getByRole("dialog")).getByText("10 / 12")).toBeInTheDocument();
  });

  test("lightbox closes via close button, Escape, and click-outside", () => {
    renderProfile();

    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Escape key.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Re-open, then close via the close button.
    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Re-open, then click the dark backdrop (outside the image).
    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("lightbox arrow keys navigate photos", () => {
    renderProfile();

    fireEvent.click(screen.getAllByAltText(/^img-/)[0]);
    expect(within(screen.getByRole("dialog")).getByText("1 / 12")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(within(screen.getByRole("dialog")).getByText("2 / 12")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(within(screen.getByRole("dialog")).getByText("1 / 12")).toBeInTheDocument();
  });
});

describe("No-services empty state", () => {
  test("a visitor sees an honest message and a way out, not a dead end", () => {
    sessionStorage.removeItem("rapidstylers_auth_token");
    renderProfile({
      stylerInformation: {
        reviewCount: 0, averageRating: "0", payoutReady: true,
        serviceTypeId: "2", serviceTypeName: "Eyelash Technician",
      },
      stylerSubService: [],
    });

    expect(screen.getByText("Nothing bookable yet")).toBeInTheDocument();
    expect(screen.getByText(/hasn't added services yet/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Browse other eyelash technicians/i });
    expect(link.getAttribute("href")).toBe(
      "/search?serviceTypeId=2&serviceTypeName=Eyelash%20Technician"
    );
  });

  test("without a category the card still offers the generic search exit", () => {
    sessionStorage.removeItem("rapidstylers_auth_token");
    renderProfile({
      stylerInformation: { reviewCount: 0, averageRating: "0", payoutReady: true },
      stylerSubService: [],
    });

    const link = screen.getByRole("link", { name: "Browse professionals" });
    expect(link.getAttribute("href")).toBe("/search");
  });

  test("a signed-in stylist sees the owner action instead", () => {
    sessionStorage.setItem("rapidstylers_auth_token", "styler-jwt");
    sessionStorage.setItem("rapidstylers_user_role", "STYLER");
    // With a token present the save-bookmark effect really fires.
    APIService.listSavedStylists.mockResolvedValue({ data: { data: [] } });
    try {
      renderProfile({
        stylerInformation: { reviewCount: 0, averageRating: "0", payoutReady: true, serviceTypeName: "Barber" },
        stylerSubService: [],
      });

      expect(screen.getByText(/You have no services listed/i)).toBeInTheDocument();
      const link = screen.getByRole("link", { name: /Add your first service/i });
      expect(link.getAttribute("href")).toBe("/styler-dashboard/services");
      // The visitor exit must NOT render for the owner view.
      expect(screen.queryByRole("link", { name: /Browse other/i })).not.toBeInTheDocument();
    } finally {
      sessionStorage.clear();
    }
  });
});

describe("StylistProfile names the vendor's time zone on working hours", () => {
  test("the hours card labels its windows with the stylist's zone", () => {
    renderProfile({
      stylerInformation: {
        reviewCount: 6, averageRating: "4.5", payoutReady: true,
        province: "British Columbia", timeZone: "America/Vancouver",
      },
      availability: [{ dayOfWeek: 2, startTime: "09:00", endTime: "17:00" }],
    });

    expect(screen.getByText(/Book during these weekly windows \(Pacific Time\)/)).toBeInTheDocument();
  });

  test("an Alberta stylist (or any default) reads Mountain Time", () => {
    renderProfile({
      stylerInformation: { reviewCount: 6, averageRating: "4.5", payoutReady: true, province: "Alberta" },
      availability: [{ dayOfWeek: 5, startTime: "10:00", endTime: "18:00" }],
    });

    expect(screen.getByText(/Book during these weekly windows \(Mountain Time\)/)).toBeInTheDocument();
  });
});
