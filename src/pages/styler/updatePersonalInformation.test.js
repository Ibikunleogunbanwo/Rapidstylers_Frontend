import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpdatePersonalInformation from "./updatePersonalInformation";
import { APIService } from "../../hooks/remote/apiService";
vi.mock("../../hooks/remote/apiService", () => ({ APIService: { getStylerOwnProfile: vi.fn(), updateStylerPersonalInfo: vi.fn() } }));
vi.mock("../../utils/constant", () => ({ showSuccessToastMessage: vi.fn() }));
const profile = { firstname: "Ada", lastname: "Lovelace", emailAddress: "ada@example.com", phoneNumber: "5875551234" };
beforeEach(() => {
  vi.resetAllMocks();
  APIService.getStylerOwnProfile.mockResolvedValue({ data: { statusCode: "200", data: profile } });
});
afterEach(cleanup);
it("prefills the profile and saves the name and cleaned phone number", async () => {
  APIService.updateStylerPersonalInfo.mockResolvedValue({ data: { statusCode: "200", message: "Personal information saved", data: { ...profile, firstname: "Grace" } } });
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  const first = await screen.findByLabelText("First name:");
  expect(first).toHaveValue("Ada");
  expect(screen.getByLabelText("Email address:")).toHaveValue("ada@example.com");
  fireEvent.change(first, { target: { value: "Grace" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(APIService.updateStylerPersonalInfo).toHaveBeenCalledWith({ firstname: "Grace", lastname: "Lovelace", phoneNumber: "5875551234" }));
});
it("keeps the email read-only because it is changed with a code", async () => {
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  expect(await screen.findByLabelText("Email address:")).toHaveAttribute("readonly");
});
it.each([
  ["First name:", "Ad4", /Use letters/],
  ["Last name:", "<script>", /Use letters/],
  ["Phone number:", "58755512345", /Enter 10 digits/],
  ["Phone number:", "1235551234", /Area code and exchange/],
  ["Phone number:", "5871551234", /Area code and exchange/],
])("blocks %s %s before any request", async (label, value, message) => {
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  fireEvent.change(await screen.findByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText(message)).toBeInTheDocument();
  expect(APIService.updateStylerPersonalInfo).not.toHaveBeenCalled();
});
it("keeps every typed phone digit instead of cutting extras off", async () => {
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  const phone = await screen.findByLabelText("Phone number:");
  fireEvent.change(phone, { target: { value: "58755512345" } });
  expect(phone).toHaveValue("58755512345");
});
it("accepts short and accented names and a +1 number, sending ten digits", async () => {
  APIService.updateStylerPersonalInfo.mockResolvedValue({ data: { statusCode: "200", data: profile } });
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  fireEvent.change(await screen.findByLabelText("First name:"), { target: { value: "  Li " } });
  fireEvent.change(screen.getByLabelText("Last name:"), { target: { value: "O’Brien-Côté" } });
  fireEvent.change(screen.getByLabelText("Phone number:"), { target: { value: "+1 587 555 1234" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(APIService.updateStylerPersonalInfo).toHaveBeenCalledWith({ firstname: "Li", lastname: "O’Brien-Côté", phoneNumber: "5875551234" }));
});
it("marks the fields required with autocomplete hints", async () => {
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  const first = await screen.findByLabelText("First name:");
  expect(first).toBeRequired();
  expect(first).toHaveAttribute("autocomplete", "given-name");
  expect(screen.getByLabelText("Last name:")).toHaveAttribute("autocomplete", "family-name");
  expect(screen.getByLabelText("Phone number:")).toHaveAttribute("autocomplete", "tel");
  expect(screen.getByLabelText("Phone number:")).toBeRequired();
});
it("shows an inline error and retry when the profile cannot be loaded", async () => {
  APIService.getStylerOwnProfile.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ data: { statusCode: "200", data: profile } });
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  expect(await screen.findByRole("alert")).toHaveTextContent(/Could not load your profile/);
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByLabelText("First name:")).toHaveValue("Ada");
});
it("reports a failed save inline", async () => {
  APIService.updateStylerPersonalInfo.mockRejectedValue(new Error("offline"));
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  await screen.findByLabelText("First name:");
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Could not save your details/);
});
