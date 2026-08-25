import { fireEvent, render, screen } from "@testing-library/react";
import BusinessSummary from "./businessSummary";

jest.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    getStylerBusinessSummary: jest.fn(),
  },
}));

import { APIService } from "../../../hooks/remote/apiService";

describe("BusinessSummary", () => {
  test("renders stats returned by the backend, not hardcoded placeholders", async () => {
    APIService.getStylerBusinessSummary.mockResolvedValue({
      data: {
        statusCode: "200",
        data: {
          totalAppointments: 12,
          clients: 5,
          pending: 2,
          confirmed: 8,
          finished: 3,
          cancelled: 1,
          totalRevenue: "240.50",
          totalCommission: "24.05",
          netRevenue: "216.45",
          popularServices: [
            { name: "Box Braids", count: 7 },
            { name: "Silk Press", count: 3 },
          ],
        },
      },
    });

    render(<BusinessSummary />);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Pending
    expect(screen.getAllByText("3")).toHaveLength(2); // Finished: 3 + Silk Press count: 3
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Box Braids")).toBeInTheDocument();
    expect(screen.getByText("Silk Press")).toBeInTheDocument();
    // Revenue stays masked until toggled.
    expect(screen.getByText("********")).toBeInTheDocument();
  });

  test("reveals net revenue (after commission) when toggled", async () => {
    APIService.getStylerBusinessSummary.mockResolvedValue({
      data: {
        statusCode: "200",
        data: {
          totalAppointments: 4,
          clients: 2,
          pending: 0,
          confirmed: 4,
          finished: 4,
          cancelled: 0,
          totalRevenue: "100.00",
          totalCommission: "10.00",
          netRevenue: "90.00",
          popularServices: [],
        },
      },
    });

    render(<BusinessSummary />);

    const eye = await screen.findByRole("img");
    fireEvent.click(eye);
    expect(screen.getByText("$90.00")).toBeInTheDocument();
    expect(screen.getByText(/Gross \$100.00 − commission \$10.00/)).toBeInTheDocument();
  });

  test("shows an empty state when there are no bookings", async () => {
    APIService.getStylerBusinessSummary.mockResolvedValue({
      data: {
        statusCode: "200",
        data: {
          totalAppointments: 0,
          clients: 0,
          confirmed: 0,
          finished: 0,
          cancelled: 0,
          totalRevenue: "0.00",
          popularServices: [],
        },
      },
    });

    render(<BusinessSummary />);

    expect(
      await screen.findByText(/No bookings yet/i)
    ).toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
    expect(screen.queryByText("$23,000")).not.toBeInTheDocument();
  });
});
