import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StylerQuotes from "./stylerQuotes";

vi.mock("../../hooks/remote/apiService", () => ({
  APIService: {
    stylerQuotes: vi.fn(),
    stylerMessageQuote: vi.fn(),
    offerQuote: vi.fn(),
    withdrawQuote: vi.fn(),
  },
}));

vi.mock("../../utils/constant", async (importOriginal) => ({
  ...(await importOriginal()),
  showSuccessToastMessage: vi.fn(),
}));

import { APIService } from "../../hooks/remote/apiService";

const waiting = {
  quoteRef: "QWAIT001",
  status: "REQUESTED",
  serviceName: "Knotless braids",
  clientName: "Ada",
  serviceTime: "visitBarber",
  noOfPeople: 3,
  description: "Waist-length knotless for me and two bridesmaids",
  preferredDates: "Saturday 10 May",
};
const sent = { ...waiting, quoteRef: "QSENT001", status: "QUOTED", price: "420.00", durationMinutes: 330, validUntil: "2030-05-04T12:00:00Z" };
const booked = { ...waiting, quoteRef: "QBOOK001", status: "ACCEPTED", price: "150.00", durationMinutes: 120 };

describe("StylerQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    APIService.stylerQuotes.mockResolvedValue({ data: { data: { items: [waiting, sent, booked], waiting: 1 } } });
  });

  test("shows requests waiting for a price first, with who, where and how many", async () => {
    render(<StylerQuotes />);

    const card = (await screen.findByText("Knotless braids")).closest("article");
    expect(within(card).getByText(/Ada · At the studio · 3 people/)).toBeInTheDocument();
    expect(within(card).getByText(/Saturday 10 May/)).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  test("sending a price posts it with the duration and how long it holds", async () => {
    APIService.offerQuote.mockResolvedValue({ data: { message: "Quote sent", data: { ...waiting, status: "QUOTED", price: "390.00", durationMinutes: 300 } } });
    render(<StylerQuotes />);

    await userEvent.click(await screen.findByRole("button", { name: "Send a price" }));
    await userEvent.type(screen.getByLabelText(/Price \(CAD\)/), "$390");
    await userEvent.selectOptions(screen.getByLabelText(/Takes about/), "300");
    await userEvent.selectOptions(screen.getByLabelText(/Price holds for/), "7");
    await userEvent.click(screen.getByRole("button", { name: "Send quote" }));

    expect(APIService.offerQuote).toHaveBeenCalledWith({
      quoteRef: "QWAIT001", price: "390", durationMinutes: 300, note: "", validDays: 7,
    });
    expect(await screen.findByText("No quote requests waiting. New ones will appear here and in Notifications.")).toBeInTheDocument();
  });

  test("a price that isn't a number is caught before sending", async () => {
    render(<StylerQuotes />);

    await userEvent.click(await screen.findByRole("button", { name: "Send a price" }));
    await userEvent.type(screen.getByLabelText(/Price \(CAD\)/), "about 300");
    await userEvent.click(screen.getByRole("button", { name: "Send quote" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a price such as 150 or 149.99");
    expect(APIService.offerQuote).not.toHaveBeenCalled();
  });

  test("the sent tab shows the price, length and expiry, and the price can be taken back", async () => {
    APIService.withdrawQuote.mockResolvedValue({ data: { data: { ...sent, status: "WITHDRAWN" } } });
    render(<StylerQuotes />);

    await userEvent.click(await screen.findByRole("tab", { name: /Price sent/ }));
    expect(screen.getByText("$420.00")).toBeInTheDocument();
    expect(screen.getByText(/5 hours 30 min/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Take back price" }));

    expect(APIService.withdrawQuote).toHaveBeenCalledWith("QSENT001");
  });

  test("a load failure offers a retry", async () => {
    APIService.stylerQuotes.mockRejectedValueOnce(new Error("down"));
    render(<StylerQuotes />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your quotes.");
  });

  test("a client message moves the quote to Waiting, shows their photos, and can be answered", async () => {
    const replied = {
      ...sent,
      needsReply: true,
      photos: ["https://res.cloudinary.com/demo/image/upload/v1/rapid_stylers/quote/acct_1/a.jpg"],
      messages: [{ from: "CUSTOMER", body: "Can the ends be curly?", createdAt: "2030-05-01T12:00:00Z" }],
    };
    APIService.stylerQuotes.mockResolvedValue({ data: { data: { items: [replied], waiting: 1 } } });
    APIService.stylerMessageQuote.mockResolvedValue({ data: { data: { ...replied, needsReply: false,
      messages: [...replied.messages, { from: "STYLIST", body: "Yes, curly ends included", createdAt: "2030-05-01T12:05:00Z" }] } } });
    const announced = vi.fn();
    window.addEventListener("rapidstylers:quotes-waiting", (event) => announced(event.detail.count));
    render(<StylerQuotes />);

    const card = (await screen.findByText("Client replied")).closest("article");
    expect(within(card).getByRole("img", { name: "Reference photo 1" })).toBeInTheDocument();
    expect(within(card).getByText("Can the ends be curly?")).toBeInTheDocument();
    await userEvent.type(within(card).getByLabelText("Message"), "Yes, curly ends included");
    await userEvent.click(within(card).getByRole("button", { name: "Send" }));

    expect(APIService.stylerMessageQuote).toHaveBeenCalledWith("QSENT001", "Yes, curly ends included");
    expect(await screen.findByText(/No quote requests waiting/)).toBeInTheDocument();
    expect(announced).toHaveBeenLastCalledWith(0);
  });
});
