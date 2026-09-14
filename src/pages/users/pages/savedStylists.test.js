import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SavedStylist from "./savedStylists";

vi.mock("../../../components/goBack", () => ({ default: () => <nav aria-label="Back" /> }));
vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: {
    listSavedStylists: vi.fn(),
    removeSavedStylist: vi.fn(),
  },
}));
vi.mock("../../../utils/constant", () => ({
  getAuthToken: vi.fn(() => "token"),
  showErrorToastMessage: vi.fn(),
  showSuccessToastMessage: vi.fn(),
}));
import { APIService } from "../../../hooks/remote/apiService";
import { getAuthToken, showErrorToastMessage, showSuccessToastMessage } from "../../../utils/constant";

const styler = (id, extra = {}) => ({
  stylerId: id,
  businessName: `Pro ${id}`,
  visibilityStatus: "Online",
  ...extra,
});

const renderPanel = () =>
  render(
    <MemoryRouter>
      <SavedStylist setPageTitle={vi.fn()} />
    </MemoryRouter>
  );

describe("SavedStylist panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthToken.mockReturnValue("token");
  });

  test("renders in the design language: hairline shell, no shadow, no gradient header", () => {
    APIService.listSavedStylists.mockResolvedValue({ data: { data: [] } });
    const { container } = renderPanel();

    const shell = container.firstElementChild;
    expect(shell.className).toContain("border-black/10");
    expect(shell.className).not.toMatch(/shadow/);
    expect(container.innerHTML).not.toContain("gradient");
    // The display heading, not the old bold small heading
    expect(screen.getByRole("heading", { name: "Saved professionals" })).toBeInTheDocument();
    expect(screen.getByText("Your list")).toBeInTheDocument();
  });

  test("lists saved professionals with a working remove flow", async () => {
    APIService.listSavedStylists.mockResolvedValue({
      data: { data: [styler("S1"), styler("S2")] },
    });
    APIService.removeSavedStylist.mockResolvedValue({});
    renderPanel();

    expect(await screen.findByText("Pro S1")).toBeInTheDocument();
    expect(screen.getByText("Pro S2")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Remove saved" })[0]);
    await waitFor(() => expect(showSuccessToastMessage).toHaveBeenCalledWith("Professional removed from saved list"));
    expect(APIService.removeSavedStylist).toHaveBeenCalledWith("S1");
    // The removed card leaves the grid without a refetch
    expect(screen.queryByText("Pro S1")).not.toBeInTheDocument();
    expect(screen.getByText("Pro S2")).toBeInTheDocument();
  });

  test("shows a failure toast when the remove call rejects", async () => {
    APIService.listSavedStylists.mockResolvedValue({ data: { data: [styler("S1")] } });
    APIService.removeSavedStylist.mockRejectedValue(new Error("network"));
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: "Remove saved" }));
    await waitFor(() => expect(showErrorToastMessage).toHaveBeenCalledWith("Unable to remove this professional"));
    // The card stays when the removal failed
    expect(screen.getByText("Pro S1")).toBeInTheDocument();
  });

  test("empty list shows the hairline empty state with guidance", async () => {
    APIService.listSavedStylists.mockResolvedValue({ data: { data: [] } });
    renderPanel();

    expect(await screen.findByText("Nothing saved yet")).toBeInTheDocument();
    expect(screen.getByText(/Tap the bookmark on any professional/)).toBeInTheDocument();
  });

  test("signed-out visitors get the sign-in prompt, not a request", async () => {
    getAuthToken.mockReturnValue(null);
    renderPanel();

    expect(await screen.findByText(/Please sign in to view saved professionals/)).toBeInTheDocument();
    expect(APIService.listSavedStylists).not.toHaveBeenCalled();
  });
});
