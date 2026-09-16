import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyWork from "./myWork";
import { APIService } from "../../hooks/remote/apiService";
import {
  deleteCloudinaryImage,
  uploadToCloudinary,
} from "../../utils/cloudinaryUpload";
import { showSuccessToastMessage } from "../../utils/constant";

vi.mock("react-router-dom", () => ({ Navigate: () => null }));
vi.mock("../../utils/constant", () => ({
  getAuthToken: () => "test-token",
  showSuccessToastMessage: vi.fn(),
}));
vi.mock("../../utils/cloudinaryImage", () => ({ cloudinaryPortrait: (url) => url }));
vi.mock("../../hooks/remote/apiService", () => ({
  APIService: {
    getOwnPortfolio: vi.fn(),
    createPortfolio: vi.fn(),
    deleteOwnPortfolioImage: vi.fn(),
  },
}));
vi.mock("../../utils/cloudinaryUpload", () => ({
  uploadToCloudinary: vi.fn(),
  deleteCloudinaryImage: vi.fn(),
}));

/** The photo picker, which is the only input that starts an upload. */
const picker = () => document.querySelector('input[type="file"]');

const photo = () => new File(["bytes"], "work.jpg", { type: "image/jpeg" });

/**
 * Picks a photo and submits the form, which is the only place an upload starts.
 *
 * The submit event is dispatched on the form rather than by clicking the button,
 * because jsdom does not run a form's submit algorithm from a button click, so a
 * click would leave the handler untested while looking like it exercised it.
 */
const submitWithPhoto = async () => {
  await userEvent.upload(picker(), photo());
  fireEvent.submit(picker().closest("form"));
};

describe("My Work upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    APIService.getOwnPortfolio.mockResolvedValue({ data: { data: [] } });
  });

  it("does not touch Cloudinary until the form is submitted", async () => {
    render(<MyWork />);
    await waitFor(() => expect(APIService.getOwnPortfolio).toHaveBeenCalled());

    await userEvent.upload(picker(), photo());

    // Picking a photo is not a decision to publish it.
    expect(uploadToCloudinary).not.toHaveBeenCalled();
    expect(deleteCloudinaryImage).not.toHaveBeenCalled();
  });

  it("keeps the uploaded image when the portfolio row is saved", async () => {
    uploadToCloudinary.mockResolvedValue({ url: "https://cdn/x.jpg", publicId: "rapid/x" });
    APIService.createPortfolio.mockResolvedValue({ data: { statusCode: "200" } });

    render(<MyWork />);
    await submitWithPhoto();

    await waitFor(() =>
      expect(APIService.createPortfolio).toHaveBeenCalledWith({
        imageUrl: "https://cdn/x.jpg",
        name: "Dreadlocks",
        category: "Dreadlocks",
      })
    );
    expect(deleteCloudinaryImage).not.toHaveBeenCalled();
    expect(showSuccessToastMessage).toHaveBeenCalled();
  });

  it("discards the uploaded image when the portfolio row cannot be saved", async () => {
    // The row is what claims the image, so a rejected save must not leave the file
    // sitting on Cloudinary with nothing pointing at it.
    uploadToCloudinary.mockResolvedValue({ url: "https://cdn/x.jpg", publicId: "rapid/x" });
    APIService.createPortfolio.mockRejectedValue(new Error("category not allowed"));

    render(<MyWork />);
    await submitWithPhoto();

    await waitFor(() => expect(deleteCloudinaryImage).toHaveBeenCalledWith("rapid/x"));
    expect(showSuccessToastMessage).not.toHaveBeenCalled();
  });

  it("has nothing to discard when the upload itself fails", async () => {
    uploadToCloudinary.mockRejectedValue(new Error("too large"));

    render(<MyWork />);
    await submitWithPhoto();

    await waitFor(() => expect(uploadToCloudinary).toHaveBeenCalled());
    expect(APIService.createPortfolio).not.toHaveBeenCalled();
    expect(deleteCloudinaryImage).not.toHaveBeenCalled();
  });
});
