import { render, screen, fireEvent, within } from "@testing-library/react";
import StylistProfile from "./stylistProfile";

jest.mock("react-router-dom", () => ({
  useParams: () => ({ stylerId: btoa("S1"), stylerName: btoa("Pro One") }),
}));
jest.mock("../userLayout/functionalEffects", () => ({
  useSingleStylerProfile: jest.fn(),
}));
jest.mock("react-redux", () => ({
  useSelector: () => ({ loading: false }),
}));
jest.mock("../../../components/spinner", () => () => null);
jest.mock("../../../components/goBack", () => () => <div data-testid="back" />);
jest.mock("../../../components/selectService", () => () => null);
jest.mock("../../../utils/constant", () => ({
  getAuthToken: () => null,
  showErrorToastMessage: jest.fn(),
  showSuccessToastMessage: jest.fn(),
}));
jest.mock("../../../hooks/remote/apiService", () => ({
  APIService: { listSavedStylists: jest.fn(), saveStylist: jest.fn(), removeSavedStylist: jest.fn() },
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

    // Page 1 shows 9 of 12 images.
    expect(screen.getAllByAltText(/^img-/)).toHaveLength(9);
    const portfolioPager = screen.getAllByText("Page 1 of 2")[0];
    expect(portfolioPager).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[0]);
    expect(screen.getAllByAltText(/^img-/)).toHaveLength(3);
    expect(screen.getAllByText("Page 2 of 2")[0]).toBeInTheDocument();
    expect(screen.getByAltText("img-12")).toBeInTheDocument();
  });

  test("paginates the reviews at 5 per page", () => {
    renderProfile();

    // Page 1 shows 5 of 6 reviews.
    expect(screen.getAllByText(/^msg-/)).toHaveLength(5);
    expect(screen.getByText("User 1")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /next/i })[1]);
    expect(screen.getAllByText(/^msg-/)).toHaveLength(1);
    expect(screen.getByText("msg-6")).toBeInTheDocument();
    expect(screen.getByText("User 6")).toBeInTheDocument();
  });

  test("hides the pager when a section fits on one page", () => {
    renderProfile({
      stylerPortfolio: portfolio(5),
      stylerReviews: reviews(3),
    });

    expect(screen.getAllByAltText(/^img-/)).toHaveLength(5);
    expect(screen.getAllByText(/^msg-/)).toHaveLength(3);
    expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
  });
});
