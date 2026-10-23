import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import MyQuotes, { quoteBookingPath } from "./myQuotes";

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    customerQuotes: vi.fn(),
    declineQuote: vi.fn(),
  },
}));

vi.mock("../../../utils/constant", async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessToastMessage: vi.fn(),
}));

import { APIService } from "../../../hooks/remote/apiService";

const ready = {
  quoteRef: "QREADY01",
  status: "QUOTED",
  stylerId: "DS5713",
  stylistName: "Nia Nails",
  serviceName: "Gel extensions",
  serviceTime: "homeService",
  noOfPeople: 1,
  description: "Long coffin set with florals",
  price: "185.00",
  durationMinutes: 150,
  note: "Includes nail art",
  validUntil: "2030-03-04T12:00:00Z",
};
const waiting = { ...ready, quoteRef: "QWAIT001", status: "REQUESTED", price: null, durationMinutes: null, note: null };

const renderPage = () => render(<MemoryRouter><MyQuotes setPageTitle={() => {}} /></MemoryRouter>);

describe("MyQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    APIService.customerQuotes.mockResolvedValue({ data: { data: [ready, waiting] } });
  });

  test("a priced quote shows the price and links to its checkout on the profile", async () => {
    renderPage();

    expect(await screen.findByText("$185.00")).toBeInTheDocument();
    expect(screen.getByText(/2 hours 30 min/)).toBeInTheDocument();
    expect(screen.getByText(/Any travel fee is added at checkout/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Book this quote" })).toHaveAttribute("href", quoteBookingPath(ready));
    expect(quoteBookingPath(ready)).toBe(`/stylistProfile/${btoa("DS5713")}/${btoa("Nia Nails")}?quote=QREADY01`);
  });

  test("a request still waiting can be cancelled but not booked", async () => {
    APIService.declineQuote.mockResolvedValue({ data: { data: { ...waiting, status: "DECLINED" } } });
    renderPage();

    await userEvent.click(await screen.findByRole("button", { name: "Cancel request" }));

    expect(APIService.declineQuote).toHaveBeenCalledWith("QWAIT001");
    expect(await screen.findByText("Closed by client")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Book this quote" })).toHaveLength(1);
  });

  test("with no quotes it says how to ask for one", async () => {
    APIService.customerQuotes.mockResolvedValue({ data: { data: [] } });
    renderPage();

    expect(await screen.findByText(/No quotes yet/)).toBeInTheDocument();
  });
});
