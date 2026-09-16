import { render, screen, fireEvent } from "@testing-library/react";
import Reviews from "./reviews";

vi.mock("../../hooks/remote/apiService", () => ({
  APIService: { getOwnStylerReviews: vi.fn() },
}));

vi.mock("../../components/spinner", () => ({ default: () => <div data-testid="spinner" /> }));

import { APIService } from "../../hooks/remote/apiService";

const review = (n, overrides = {}) => ({
  userName: `Client ${n}`,
  ratingScore: String(n % 5 || 5),
  message: `Review message ${n}`,
  createdAt: "2026-09-01 10:00:00",
  bookingId: `BK-${n}`,
  ...overrides,
});

const respond = (data) =>
  APIService.getOwnStylerReviews.mockResolvedValue({ data: { statusCode: "200", data } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("the stylist's reviews page", () => {
  it("shows the average and count the backend reports, with the reviews themselves", async () => {
    respond({
      reviews: [review(1), review(2)],
      reviewCount: 2,
      averageRating: 4.5,
      pendingCount: 0,
    });

    render(<Reviews />);

    expect(await screen.findByText("4.5")).toBeInTheDocument();
    expect(screen.getByText(/based on 2 reviews/)).toBeInTheDocument();
    expect(screen.getByText("Client 1")).toBeInTheDocument();
    expect(screen.getByText("Review message 2")).toBeInTheDocument();
    expect(screen.getByText("This is what clients see on your public profile.")).toBeInTheDocument();
  });

  it("reports how many reviews are still in moderation instead of hiding them", async () => {
    respond({
      reviews: [review(1)],
      reviewCount: 1,
      averageRating: 5,
      pendingCount: 2,
    });

    render(<Reviews />);

    expect(await screen.findByText(/2 reviews waiting on moderation/)).toBeInTheDocument();
  });

  it("pages through past reviews rather than dropping them off the page", async () => {
    respond({
      reviews: Array.from({ length: 7 }, (_, i) => review(i + 1)),
      reviewCount: 7,
      averageRating: 4.1,
      pendingCount: 0,
    });

    render(<Reviews />);

    expect(await screen.findByText("Client 5")).toBeInTheDocument();
    expect(screen.queryByText("Client 6")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1–5 of 7")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText("Client 6")).toBeInTheDocument();
    expect(screen.getByText("Client 7")).toBeInTheDocument();
    expect(screen.queryByText("Client 1")).not.toBeInTheDocument();
  });

  it("explains what puts a review on the page when there are none", async () => {
    respond({ reviews: [], reviewCount: 0, averageRating: null, pendingCount: 0 });

    render(<Reviews />);

    expect(await screen.findByText("No reviews yet")).toBeInTheDocument();
    expect(screen.getByText(/Completed\s+appointments are the only ones a client can review/)).toBeInTheDocument();
    // Nothing to page through, so the pager stays out of the way.
    expect(screen.queryByRole("button", { name: /next/i })).not.toBeInTheDocument();
  });

  it("says so plainly when the reviews cannot be loaded", async () => {
    APIService.getOwnStylerReviews.mockRejectedValue(new Error("network"));

    render(<Reviews />);

    expect(await screen.findByText(/Could not load your reviews/)).toBeInTheDocument();
  });

  it("never publishes the retired placeholder review copy", async () => {
    respond({ reviews: [review(1)], reviewCount: 1, averageRating: 5, pendingCount: 0 });

    const { container } = render(<Reviews />);
    await screen.findByText("Client 1");

    expect(container.textContent).not.toMatch(/Nurudeen|419 reviews|4\.0 \(out of 5\)/);
  });

  it("survives a review row with no message or date", async () => {
    respond({
      reviews: [review(1, { message: null, createdAt: null, userName: "Quiet Client" })],
      reviewCount: 1,
      averageRating: 3,
      pendingCount: 0,
    });

    render(<Reviews />);

    expect(await screen.findByText("Quiet Client")).toBeInTheDocument();
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
  });
});
