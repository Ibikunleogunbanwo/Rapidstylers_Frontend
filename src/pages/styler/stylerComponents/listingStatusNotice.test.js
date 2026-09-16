import { render, screen, waitFor } from "@testing-library/react";
import ListingStatusNotice from "./listingStatusNotice";
import { APIService } from "../../../hooks/remote/apiService";
import { SUPPORT_EMAIL } from "../../../utils/constant";

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { getStylerBusinessSummary: vi.fn() },
}));

/**
 * A professional whose profile has no address is invisible in search, and the
 * dashboard previously said nothing about it: they just saw no bookings. This
 * notice is the only place that explains the cause, so the cases that must stay
 * silent matter as much as the one that speaks.
 */
describe("the listing status notice", () => {
  const summary = (data) => ({ data: { data } });

  it("explains a profile hidden for having no address, and how to fix it", async () => {
    APIService.getStylerBusinessSummary.mockResolvedValue(
      summary({ addressOnFile: false, bookable: false })
    );

    render(<ListingStatusNotice />);

    expect(await screen.findByText("You are not showing in search")).toBeTruthy();
    expect(screen.getByText(/clients travel to that address/i)).toBeTruthy();
    const action = screen.getByRole("link", { name: "Send us your address" });
    expect(action.getAttribute("href")).toContain(`mailto:${SUPPORT_EMAIL}`);
  });

  it("says nothing when an address is on file", async () => {
    APIService.getStylerBusinessSummary.mockResolvedValue(
      summary({ addressOnFile: true, bookable: true })
    );

    const { container } = render(<ListingStatusNotice />);

    await waitFor(() => expect(APIService.getStylerBusinessSummary).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("stays silent when the summary cannot be read, rather than warning on a guess", async () => {
    APIService.getStylerBusinessSummary.mockRejectedValue(new Error("offline"));

    const { container } = render(<ListingStatusNotice />);

    await waitFor(() => expect(APIService.getStylerBusinessSummary).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("stays silent when the flag is absent, so an older backend cannot trigger it", async () => {
    APIService.getStylerBusinessSummary.mockResolvedValue(summary({ totalAppointments: 3 }));

    const { container } = render(<ListingStatusNotice />);

    await waitFor(() => expect(APIService.getStylerBusinessSummary).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
