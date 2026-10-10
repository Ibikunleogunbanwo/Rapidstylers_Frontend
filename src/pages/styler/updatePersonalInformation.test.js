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
it("blocks a name under the backend minimum before any request", async () => {
  render(<MemoryRouter><UpdatePersonalInformation /></MemoryRouter>);
  const first = await screen.findByLabelText("First name:");
  fireEvent.change(first, { target: { value: "ab" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText(/at least 3 characters/);
  expect(APIService.updateStylerPersonalInfo).not.toHaveBeenCalled();
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
