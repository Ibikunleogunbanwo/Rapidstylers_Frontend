import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ServiceOutcome from "./serviceOutcome";
import { APIService } from "../../../hooks/remote/apiService";

vi.mock("../../../hooks/remote/apiService", () => ({
  APIService: { confirmService: vi.fn(), disputeService: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

const props = { appointmentId: "a1", disputeWindowEndsAt: "2030-01-01T12:00:00" };

it("shows actions only while the backend provides a dispute window", () => {
  const { rerender } = render(<ServiceOutcome appointmentId="a1" />);
  expect(screen.queryByRole("button", { name: "It happened" })).not.toBeInTheDocument();
  rerender(<ServiceOutcome {...props} />);
  expect(screen.getByRole("button", { name: "It happened" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Report a problem" })).toBeVisible();
});

it("reviews confirmation, sends once, and removes both actions on success", async () => {
  let finish;
  APIService.confirmService.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  render(<ServiceOutcome {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "It happened" }));
  expect(APIService.confirmService).not.toHaveBeenCalled();
  const confirm = screen.getByRole("button", { name: "Confirm service happened" });
  fireEvent.click(confirm);
  fireEvent.click(confirm);
  expect(APIService.confirmService).toHaveBeenCalledTimes(1);
  expect(APIService.confirmService).toHaveBeenCalledWith("a1");
  finish({ data: { statusCode: "200" } });
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("confirmed"));
  expect(screen.queryByRole("button", { name: "Report a problem" })).not.toBeInTheDocument();
});

it("validates a report and preserves its reason on failure, then succeeds", async () => {
  APIService.disputeService
    .mockRejectedValueOnce(new Error("failed"))
    .mockResolvedValueOnce({ data: { statusCode: 200 } });
  render(<ServiceOutcome {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Report a problem" }));
  fireEvent.click(screen.getByRole("button", { name: "Send report" }));
  expect(APIService.disputeService).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("What went wrong?"), {
    target: { value: "  Stylist did not arrive  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("could not"));
  expect(screen.getByLabelText("What went wrong?")).toHaveValue("  Stylist did not arrive  ");
  fireEvent.click(screen.getByRole("button", { name: "Send report" }));
  await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("reported"));
  expect(APIService.disputeService).toHaveBeenLastCalledWith({
    appointmentId: "a1",
    reason: "Stylist did not arrive",
  });
});

it("renders open and resolved dispute states without offering another report", () => {
  const { rerender } = render(<ServiceOutcome {...props} serviceDisputeStatus="OPEN" />);
  expect(screen.getByRole("status")).toHaveTextContent("under review");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
  rerender(<ServiceOutcome {...props} serviceDisputeStatus="RESOLVED" />);
  expect(screen.getByRole("status")).toHaveTextContent("resolved");
});

it("shows a resolved dispute's outcome, the customer's reason and the resolution note", () => {
  render(
    <ServiceOutcome
      {...props}
      serviceDisputeStatus="RESOLVED"
      serviceDisputeReason="Stylist never arrived"
      serviceDisputeResolutionNote="Refunded in full and the stylist was re-reviewed."
      serviceDisputeResolvedAt="2026-10-09"
    />,
  );
  const panel = screen.getByRole("status");
  expect(panel).toHaveTextContent("Your service dispute has been resolved.");
  expect(panel).toHaveTextContent("What you told us: Stylist never arrived");
  expect(panel).toHaveTextContent("Our response: Refunded in full and the stylist was re-reviewed.");
  expect(panel).toHaveTextContent("Resolved on 2026-10-09");
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});

it("still reports resolution plainly when the backend omits the note", () => {
  render(<ServiceOutcome {...props} serviceDisputeStatus="RESOLVED" />);
  const panel = screen.getByRole("status");
  expect(panel).toHaveTextContent("Your service dispute has been resolved.");
  expect(panel).not.toHaveTextContent("Our response:");
});

it("echoes the customer's own words while a report is under review", () => {
  render(
    <ServiceOutcome {...props} serviceDisputeStatus="OPEN" serviceDisputeReason="Nobody came" />,
  );
  const panel = screen.getByRole("status");
  expect(panel).toHaveTextContent("under review");
  expect(panel).toHaveTextContent("What you told us: Nobody came");
});
