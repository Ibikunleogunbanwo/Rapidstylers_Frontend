import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReviewsSummary from "./reviewsSummary";

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { getOwnStylerReviews: vi.fn() },
}));

import { APIService } from "../../../hooks/remote/apiService";

const renderCard = () =>
  render(
    <MemoryRouter>
      <ReviewsSummary />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the dashboard reviews card", () => {
  it("opens the full review list when clicked", async () => {
    APIService.getOwnStylerReviews.mockResolvedValue({
      data: { data: { reviews: [], reviewCount: 6, averageRating: 4.7, pendingCount: 0 } },
    });

    renderCard();

    expect(await screen.findByText("4.7")).toBeInTheDocument();
    expect(screen.getByText("6 reviews")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/styler-dashboard/reviews");
    expect(screen.getByText("See past reviews")).toBeInTheDocument();
  });

  it("flags reviews that are not public yet", async () => {
    APIService.getOwnStylerReviews.mockResolvedValue({
      data: { data: { reviews: [], reviewCount: 0, averageRating: null, pendingCount: 1 } },
    });

    renderCard();

    expect(await screen.findByText("1 review waiting for approval.")).toBeInTheDocument();
    expect(screen.getByText("Not rated")).toBeInTheDocument();
    // The card must not deny a review the stylist has been told about.
    expect(screen.getByText("None public yet")).toBeInTheDocument();
    expect(screen.queryByText("No reviews yet")).not.toBeInTheDocument();
  });

  it("says there are no reviews only when there is nothing in the queue either", async () => {
    APIService.getOwnStylerReviews.mockResolvedValue({
      data: { data: { reviews: [], reviewCount: 0, averageRating: null, pendingCount: 0 } },
    });

    renderCard();

    expect(await screen.findByText("No reviews yet")).toBeInTheDocument();
    expect(screen.queryByText("None public yet")).not.toBeInTheDocument();
  });

  it("stays a working link when the reviews cannot be loaded", async () => {
    APIService.getOwnStylerReviews.mockRejectedValue(new Error("network"));

    renderCard();

    expect(await screen.findByText("Not rated")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/styler-dashboard/reviews");
  });
});
