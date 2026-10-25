import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequestQuote from "./requestQuote";

vi.mock("../hooks/remote/apiService", () => ({
  APIService: { requestQuote: vi.fn() },
}));
vi.mock("../utils/cloudinaryUpload", () => ({ uploadToCloudinary: vi.fn() }));
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

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

  test("photos are uploaded to the quote folder and sent with the request, three at most", async () => {
    getAuthToken.mockReturnValue("token");
    getUserRole.mockReturnValue("CUSTOMER");
    APIService.requestQuote.mockResolvedValue({ data: { statusCode: "200" } });
    uploadToCloudinary.mockImplementation(async (file) => ({ url: `https://res.cloudinary.com/x/${file.name}` }));
    renderAt();

    await userEvent.click(screen.getByRole("button", { name: "Request a quote" }));
    const files = ["a", "b", "c", "d"].map((name) => new File(["x"], `${name}.jpg`, { type: "image/jpeg" }));
    await userEvent.upload(screen.getByLabelText("Add reference photos"), files);
    expect(screen.getByRole("button", { name: "Remove c.jpg" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove d.jpg" })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("What would you like?"), "Long almond set like these photos");
    await userEvent.click(screen.getByRole("button", { name: "Send request" }));

    await screen.findByText("My quotes page");
    expect(uploadToCloudinary).toHaveBeenCalledTimes(3);
    expect(uploadToCloudinary.mock.calls.every(([, folder]) => folder === "quote")).toBe(true);
    expect(APIService.requestQuote).toHaveBeenCalledWith(expect.objectContaining({
      photoUrls: ["https://res.cloudinary.com/x/a.jpg", "https://res.cloudinary.com/x/b.jpg", "https://res.cloudinary.com/x/c.jpg"],
    }));
  });

  test("a price-on-quote row shows only the button, with that service chosen", async () => {
    getAuthToken.mockReturnValue("token");
    getUserRole.mockReturnValue("CUSTOMER");
    render(<MemoryRouter><RequestQuote compact serviceId={8} stylerId="DS5713" services={services} /></MemoryRouter>);

    expect(screen.queryByText("Need something custom?")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Request a quote" }));
    expect(screen.getByLabelText("Closest service")).toHaveValue("8");
  });
});
