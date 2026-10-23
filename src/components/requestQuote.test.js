import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequestQuote from "./requestQuote";

vi.mock("../hooks/remote/apiService", () => ({
  APIService: { requestQuote: vi.fn() },
}));

vi.mock("../utils/constant", async (importOriginal) => ({
  ...(await importOriginal()),
  getAuthToken: vi.fn(),
  getUserRole: vi.fn(),
  setIntendedRoute: vi.fn(),
  showSuccessToastMessage: vi.fn(),
}));

import { APIService } from "../hooks/remote/apiService";
import { getAuthToken, getUserRole, setIntendedRoute } from "../utils/constant";

const services = [{ id: 7, name: "Gel extensions" }, { id: 8, name: "Nail art" }];
const renderAt = () => render(
  <MemoryRouter initialEntries={["/stylistProfile/a/b"]}>
    <Routes>
      <Route path="/stylistProfile/:a/:b" element={<RequestQuote stylerId="DS5713" stylerName="Nia" services={services} />} />
      <Route path="/login" element={<p>Sign in page</p>} />
      <Route path="/myQuotes" element={<p>My quotes page</p>} />
    </Routes>
  </MemoryRouter>
);

describe("RequestQuote", () => {
  beforeEach(() => vi.clearAllMocks());

  test("a signed-out visitor is sent to sign in and remembered", async () => {
    getAuthToken.mockReturnValue(null);
    renderAt();

    await userEvent.click(screen.getByRole("button", { name: "Request a quote" }));

    expect(setIntendedRoute).toHaveBeenCalled();
    expect(await screen.findByText("Sign in page")).toBeInTheDocument();
  });

  test("a customer describes the job and the request is sent", async () => {
    getAuthToken.mockReturnValue("token");
    getUserRole.mockReturnValue("CUSTOMER");
    APIService.requestQuote.mockResolvedValue({ data: { statusCode: "200" } });
    renderAt();

    await userEvent.click(screen.getByRole("button", { name: "Request a quote" }));
    await userEvent.selectOptions(screen.getByLabelText("Closest service"), "8");
    await userEvent.type(screen.getByLabelText("What would you like?"), "Hand-painted florals on all ten nails");
    await userEvent.type(screen.getByLabelText(/When suits you/), "Weekday evenings");
    await userEvent.click(screen.getByRole("button", { name: "Send request" }));

    expect(APIService.requestQuote).toHaveBeenCalledWith({
      stylerId: "DS5713", subServiceId: "8", description: "Hand-painted florals on all ten nails",
      preferredDates: "Weekday evenings", serviceTime: "visitBarber", noOfPeople: 1,
    });
    expect(await screen.findByText("My quotes page")).toBeInTheDocument();
  });

  test("too short a description is caught before sending", async () => {
    getAuthToken.mockReturnValue("token");
    getUserRole.mockReturnValue("CUSTOMER");
    renderAt();

    await userEvent.click(screen.getByRole("button", { name: "Request a quote" }));
    await userEvent.type(screen.getByLabelText("What would you like?"), "nails");
    await userEvent.click(screen.getByRole("button", { name: "Send request" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/a little more/);
    expect(APIService.requestQuote).not.toHaveBeenCalled();
  });

  test("a professional with no services has nothing to quote against", () => {
    const { container } = render(<MemoryRouter><RequestQuote stylerId="X" services={[]} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
});
