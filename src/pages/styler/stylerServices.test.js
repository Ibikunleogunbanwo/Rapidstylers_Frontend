import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Services, { servicePriceProblem } from "./stylerServices";
import { APIService } from "../../hooks/remote/apiService";

vi.mock("../../hooks/remote/apiService", () => ({
  APIService: { listSubServices: vi.fn(), createSubService: vi.fn(), updateSubService: vi.fn() },
}));
vi.mock("../../utils/constant", async (importOriginal) => ({
  ...(await importOriginal()),
  getAuthToken: vi.fn(() => "jwt"),
  showSuccessToastMessage: vi.fn(),
}));

const mount = () => render(<MemoryRouter><Services /></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks();
  APIService.listSubServices.mockResolvedValue({ data: { data: [{ id: 7, name: "Knotless braids", price: "120.00", durationMinutes: 90, status: "Active" }] } });
});

describe("the add service dialog", () => {
  it("is a labelled modal dialog that takes focus and closes on Escape", async () => {
    mount();
    const opener = screen.getByRole("button", { name: "+ Add a new service" });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "Add new service" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByLabelText("Service name:")).toHaveFocus();
    expect(within(dialog).getByRole("button", { name: "Close" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("closes from the labelled close button", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a new service" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses a required numeric currency input for the amount", () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a new service" }));
    const amount = screen.getByLabelText("Amount ($):");
    expect(amount).toHaveAttribute("type", "number");
    expect(amount).toHaveAttribute("min", "0");
    expect(amount).toHaveAttribute("max", "10000");
    expect(amount).toHaveAttribute("step", "0.01");
    expect(amount).toBeRequired();
    expect(screen.getByLabelText("Service name:")).toBeRequired();
  });

  it("requires a service name", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a new service" }));
    fireEvent.change(screen.getByLabelText("Amount ($):"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Add service" }));
    expect(await screen.findByText("Service name is required")).toBeInTheDocument();
    expect(APIService.createSubService).not.toHaveBeenCalled();
  });

  it("sends a valid amount with two decimals", async () => {
    APIService.createSubService.mockResolvedValue({ data: { statusCode: "200" } });
    mount();
    fireEvent.click(screen.getByRole("button", { name: "+ Add a new service" }));
    fireEvent.change(screen.getByLabelText("Service name:"), { target: { value: " Braids " } });
    fireEvent.change(screen.getByLabelText("Amount ($):"), { target: { value: "45.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Add service" }));
    await waitFor(() => expect(APIService.createSubService).toHaveBeenCalledWith({ name: "Braids", price: "45.50", durationMinutes: "60" }));
  });
});

it("lists services as stacked cards for phones, with status and action in view", async () => {
  mount();
  const list = await screen.findByRole("list", { name: "My services" });
  expect(within(list).getByText("Knotless braids")).toBeInTheDocument();
  expect(within(list).getByText("Active")).toBeInTheDocument();
  expect(within(list).getByRole("button", { name: "Edit Knotless braids" })).toBeInTheDocument();
});

it.each([
  ["", "Amount is required"],
  ["abc-5", "Enter an amount in dollars, e.g. 45 or 45.50 (up to 2 decimals)"],
  ["0", "Amount must be greater than $0"],
  ["10000", null],
  ["0.01", null],
  ["10000.5", "Amount cannot be more than $10,000"],
])("servicePriceProblem(%s)", (value, expected) => {
  expect(servicePriceProblem(value)).toBe(expected);
});
