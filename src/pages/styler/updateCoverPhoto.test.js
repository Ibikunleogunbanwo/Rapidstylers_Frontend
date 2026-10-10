import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UpdateCoverPhoto from "./updateCoverPhoto";
import { APIService } from "../../hooks/remote/apiService";
import { uploadToCloudinary } from "../../utils/cloudinaryUpload";
vi.mock("../../hooks/remote/apiService", () => ({ APIService: { getStylerOwnProfile: vi.fn(), updateStylerPhotos: vi.fn() } }));
vi.mock("../../utils/cloudinaryUpload", () => ({ uploadToCloudinary: vi.fn() }));
vi.mock("../../utils/constant", () => ({ showSuccessToastMessage: vi.fn() }));
const profile = { profileImageUrl: "https://cloud/old-profile", coverImageUrl: "https://cloud/old-cover" };
const file = () => new File(["image"], "photo.png", { type: "image/png" });
beforeEach(() => {
  vi.resetAllMocks();
  global.URL.createObjectURL = vi.fn(() => "blob:preview");
  global.URL.revokeObjectURL = vi.fn();
  APIService.getStylerOwnProfile.mockResolvedValue({ data: { statusCode: "200", data: profile } });
});
afterEach(cleanup);
it("uploads only the chosen photo and saves its URL", async () => {
  uploadToCloudinary.mockResolvedValue({ url: "https://cloud/new-profile" });
  APIService.updateStylerPhotos.mockResolvedValue({ data: { statusCode: "200", message: "Photos saved", data: { ...profile, profileImageUrl: "https://cloud/new-profile" } } });
  render(<MemoryRouter><UpdateCoverPhoto /></MemoryRouter>);
  fireEvent.change(await screen.findByLabelText("Choose profile photo"), { target: { files: [file()] } });
  fireEvent.click(screen.getByRole("button", { name: "Save photos" }));
  await waitFor(() => expect(APIService.updateStylerPhotos).toHaveBeenCalledWith({ profileImageUrl: "https://cloud/new-profile" }));
  expect(uploadToCloudinary).toHaveBeenCalledTimes(1);
  expect(uploadToCloudinary.mock.calls[0][1]).toBe("profile");
});
it("asks for a photo before saving anything", async () => {
  render(<MemoryRouter><UpdateCoverPhoto /></MemoryRouter>);
  await screen.findByText("Cover photo");
  fireEvent.click(screen.getByRole("button", { name: "Save photos" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Choose a photo/);
  expect(APIService.updateStylerPhotos).not.toHaveBeenCalled();
});
it("surfaces an upload authorization failure without saving", async () => {
  uploadToCloudinary.mockRejectedValue(Object.assign(new Error("upload failed"), { code: "UPLOAD_AUTHORIZATION" }));
  render(<MemoryRouter><UpdateCoverPhoto /></MemoryRouter>);
  fireEvent.change(await screen.findByLabelText("Choose cover photo"), { target: { files: [file()] } });
  fireEvent.click(screen.getByRole("button", { name: "Save photos" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Photo uploads are temporarily unavailable/);
  expect(APIService.updateStylerPhotos).not.toHaveBeenCalled();
});
