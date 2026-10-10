import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpdateBusinessInformation from "./updateBusinessInformation";
import { APIService } from "../../hooks/remote/apiService";
vi.mock("../../hooks/remote/apiService", () => ({ APIService: { getStylerOwnProfile: vi.fn(), getStylerType: vi.fn(), updateStylerBusinessInfo: vi.fn(), placeAutocomplete: vi.fn() } }));
vi.mock("../../utils/constant", () => ({ showSuccessToastMessage: vi.fn() }));
const profile = {
  serviceTypeId: "1",
  businessName: "Glow Studio",
  description: "Calm, tidy cuts.",
  streetAddress: "1 Main St",
  unit: "4",
  city: "Calgary",
  province: "AB",
  postalCode: "T2P 1B5",
  country: "Canada",
  businessAddress: "1 Main St 4, Calgary, AB T2P 1B5, Canada",
  timeZone: "America/Edmonton",
};
beforeEach(() => {
  vi.resetAllMocks();
  APIService.getStylerOwnProfile.mockResolvedValue({ data: { statusCode: "200", data: profile } });
  APIService.getStylerType.mockResolvedValue({ data: { data: [{ serviceTypeId: "1", serviceTypeName: "Barber" }, { serviceTypeId: "2", serviceTypeName: "Stylist" }] } });
});
afterEach(cleanup);
it("prefills the business details and saves them", async () => {
  APIService.updateStylerBusinessInfo.mockResolvedValue({ data: { statusCode: "200", message: "Business information saved", data: profile } });
  render(<MemoryRouter><UpdateBusinessInformation /></MemoryRouter>);
  const name = await screen.findByLabelText("Business name:");
  expect(name).toHaveValue("Glow Studio");
  fireEvent.change(name, { target: { value: "Glow Mart" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(APIService.updateStylerBusinessInfo).toHaveBeenCalledWith({
    businessName: "Glow Mart",
    description: "Calm, tidy cuts.",
    serviceTypeId: "1",
    streetAddress: "1 Main St",
    unit: "4",
    city: "Calgary",
    province: "AB",
    postalCode: "T2P 1B5",
    country: "Canada",
    timeZone: "America/Edmonton",
  }));
});
it("requires the core address fields before sending", async () => {
  render(<MemoryRouter><UpdateBusinessInformation /></MemoryRouter>);
  const city = await screen.findByLabelText("City:");
  fireEvent.change(city, { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText(/City is required/);
  expect(APIService.updateStylerBusinessInfo).not.toHaveBeenCalled();
});
it("reports a save failure inline without losing the entered values", async () => {
  APIService.updateStylerBusinessInfo.mockRejectedValue(new Error("offline"));
  render(<MemoryRouter><UpdateBusinessInformation /></MemoryRouter>);
  const name = await screen.findByLabelText("Business name:");
  fireEvent.change(name, { target: { value: "Kept Name" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Could not save your business details/);
  expect(screen.getByLabelText("Business name:")).toHaveValue("Kept Name");
});
