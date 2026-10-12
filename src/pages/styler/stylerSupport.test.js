import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StylerSupport from "./stylerSupport";
import { APIService } from "../../hooks/remote/apiService";

vi.mock("../../hooks/remote/apiService", () => ({ APIService: { listSupportTickets: vi.fn(), createSupportTicket: vi.fn() } }));
vi.mock("../../utils/constant", async (importOriginal) => ({ ...(await importOriginal()), getAuthToken: vi.fn(() => "jwt"), showSuccessToastMessage: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  APIService.listSupportTickets.mockResolvedValue({ data: { data: [{ id: 1, subject: "Payout question", message: "When?", status: "OPEN", category: "PAYMENT", updatedAt: "2026-10-12" }] } });
});

it("lists the professional's tickets and creates one through /support_tickets", async () => {
  APIService.createSupportTicket.mockResolvedValue({ data: { statusCode: "200" } });
  render(<MemoryRouter><StylerSupport /></MemoryRouter>);
  expect(await screen.findByText("Payout question")).toBeInTheDocument();
  expect(screen.getByText("Payment", { selector: "span" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Subject/), { target: { value: " Calendar " } });
  fireEvent.change(screen.getByLabelText(/^Describe the issue/), { target: { value: "Shows the wrong day" } });
  // The topic is required: without it nothing is sent.
  fireEvent.submit(screen.getByRole("button", { name: "Submit ticket" }).closest("form"));
  expect(APIService.createSupportTicket).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/^What is this about\?/), { target: { value: "TECHNICAL" } });
  fireEvent.click(screen.getByRole("button", { name: "Submit ticket" }));
  await waitFor(() => expect(APIService.createSupportTicket).toHaveBeenCalledWith({ subject: "Calendar", message: "Shows the wrong day", category: "TECHNICAL" }));
  expect(APIService.listSupportTickets).toHaveBeenCalledTimes(2);
});
