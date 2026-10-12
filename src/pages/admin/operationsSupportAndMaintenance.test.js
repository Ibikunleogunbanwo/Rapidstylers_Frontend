/**
 * Operations: support tickets by category (C-11) and the owner-only move of
 * legacy ID photos to private storage (A-01).
 */
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { setAuthToken, setAdminRole, setAdminLevel } from "../../utils/constant";
import Operations from "./operations";

vi.mock("../../hooks/remote/apiService", () => ({ APIService: {
  adminKpis: vi.fn(), adminSupportTickets: vi.fn(), adminUpdateSupportTicket: vi.fn(), adminAuditLogs: vi.fn(),
  getCommissionSetting: vi.fn(), updateCommissionSetting: vi.fn(), adminStylerConnectStatuses: vi.fn(), adminStylerBusinessSummaries: vi.fn(),
} }));
vi.mock("../../hooks/remote/adminApi", () => ({ AdminAPI: { migrateIdentificationImages: vi.fn(), reviews: vi.fn(), feedback: vi.fn() } }));

const reply = data => ({ data: { statusCode: "200", data } });
const signIn = level => { setAuthToken("jwt"); setAdminRole(); setAdminLevel(level); };
const open = path => render(<MemoryRouter initialEntries={[path]}><Operations /></MemoryRouter>);
const page = (fields) => ({ dryRun: true, examined: 0, found: 0, migrated: 0, alreadyPrivate: 0, failed: 0, notCloudinary: 0, ids: [], failedIds: [], failures: [], publicCopyKeptIds: [], nextAfterId: null, ...fields });

beforeEach(() => {
  sessionStorage.clear();
  vi.resetAllMocks();
  APIService.adminKpis.mockResolvedValue(reply({ customers: 1 }));
  APIService.getCommissionSetting.mockResolvedValue(reply({ commissionPercent: 15 }));
});
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });

describe("support tickets by category", () => {
  it("shows each ticket's category and asks the server for one category when filtered", async () => {
    signIn("MANAGER");
    APIService.adminSupportTickets.mockImplementation(category => Promise.resolve(reply(category === "PAYMENT"
      ? [{ id: 2, subject: "Charged twice", status: "OPEN", category: "PAYMENT" }]
      : [{ id: 1, subject: "Calendar wrong", status: "OPEN", category: "TECHNICAL" }, { id: 2, subject: "Charged twice", status: "OPEN", category: "PAYMENT" }])));
    open("/admin/operations?section=tickets");
    const ticket = (await screen.findByText("Calendar wrong")).closest("div.rounded-lg");
    expect(within(ticket).getByText("Technical")).toBeInTheDocument();
    expect(APIService.adminSupportTickets).toHaveBeenLastCalledWith(undefined);

    const filter = screen.getByLabelText("Ticket category");
    expect([...filter.options].map(o => o.textContent)).toEqual(["All categories", "Booking", "Payment", "Account", "Technical", "Other"]);
    fireEvent.change(filter, { target: { value: "PAYMENT" } });
    await waitFor(() => expect(screen.queryByText("Calendar wrong")).not.toBeInTheDocument());
    expect(screen.getByText("Charged twice")).toBeInTheDocument();
    expect(APIService.adminSupportTickets).toHaveBeenLastCalledWith("PAYMENT");
  });

  it("says when a category has no tickets", async () => {
    signIn("ADMIN");
    APIService.adminSupportTickets.mockResolvedValue(reply([]));
    open("/admin/operations?section=tickets");
    await screen.findByText("No support tickets.");
    fireEvent.change(screen.getByLabelText("Ticket category"), { target: { value: "ACCOUNT" } });
    expect(await screen.findByText("No Account tickets.")).toBeInTheDocument();
  });
});

describe("making old ID photos private", () => {
  it("is not shown to a manager", () => {
    signIn("MANAGER");
    open("/admin/operations?section=settings");
    expect(screen.getByRole("heading", { name: "Owner access needed" })).toBeInTheDocument();
    expect(screen.queryByText("Make old ID photos private")).not.toBeInTheDocument();
    expect(AdminAPI.migrateIdentificationImages).not.toHaveBeenCalled();
  });

  it("checks every page as a dry run, then makes the photos private after confirming", async () => {
    signIn("ADMIN");
    AdminAPI.migrateIdentificationImages
      .mockResolvedValueOnce(page({ examined: 100, found: 3, alreadyPrivate: 90, notCloudinary: 7, nextAfterId: 120 }))
      .mockResolvedValueOnce(page({ examined: 20, found: 1, alreadyPrivate: 19, nextAfterId: null }))
      .mockResolvedValueOnce(page({ dryRun: false, examined: 100, found: 3, migrated: 2, failed: 1, alreadyPrivate: 90, notCloudinary: 7, failures: [{ stylerId: 42, reason: "Image not found" }], publicCopyKeptIds: [17], nextAfterId: 120 }))
      .mockResolvedValueOnce(page({ dryRun: false, examined: 20, found: 1, migrated: 1, alreadyPrivate: 19, nextAfterId: null }));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    open("/admin/operations?section=settings");
    expect(await screen.findByRole("heading", { name: "Make old ID photos private" })).toBeInTheDocument();
    expect(screen.getByText(/stored with public links/)).toBeInTheDocument();
    const makePrivate = screen.getByRole("button", { name: "Make private" });
    expect(makePrivate).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(await screen.findByText(/Check finished: 4 ID photos still public out of 120 stylists looked at/)).toBeInTheDocument();
    expect(AdminAPI.migrateIdentificationImages).toHaveBeenNthCalledWith(1, { dryRun: true, afterId: null, limit: 100 });
    expect(AdminAPI.migrateIdentificationImages).toHaveBeenNthCalledWith(2, { dryRun: true, afterId: 120, limit: 100 });
    expect(makePrivate).not.toBeDisabled();

    fireEvent.click(makePrivate);
    expect(confirm).toHaveBeenCalledWith("Make 4 ID photos private? The public copies will be removed. This cannot be undone.");
    expect(await screen.findByText("Done: 3 photos made private.")).toBeInTheDocument();
    expect(AdminAPI.migrateIdentificationImages).toHaveBeenNthCalledWith(3, { dryRun: false, afterId: null, limit: 100 });
    expect(AdminAPI.migrateIdentificationImages).toHaveBeenNthCalledWith(4, { dryRun: false, afterId: 120, limit: 100 });
    expect(screen.getByText("Stylist 42: Image not found")).toBeInTheDocument();
    expect(screen.getByText(/public copy could not be removed \(stylist 17\)/)).toBeInTheDocument();
    // A finished run needs a fresh check before it can run again.
    expect(screen.getByRole("button", { name: "Make private" })).toBeDisabled();
  });

  it("keeps Make private off when the check finds nothing, and does nothing when the owner cancels", async () => {
    signIn("ADMIN");
    AdminAPI.migrateIdentificationImages.mockResolvedValueOnce(page({ examined: 5, alreadyPrivate: 5 }));
    open("/admin/operations?section=settings");
    fireEvent.click(await screen.findByRole("button", { name: "Check" }));
    expect(await screen.findByText(/no public ID photos left/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make private" })).toBeDisabled();

    AdminAPI.migrateIdentificationImages.mockResolvedValueOnce(page({ examined: 5, found: 2 }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Make private" })).not.toBeDisabled());
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: "Make private" }));
    expect(AdminAPI.migrateIdentificationImages).toHaveBeenCalledTimes(2);
  });

  it("shows the server's message when a page fails", async () => {
    signIn("ADMIN");
    AdminAPI.migrateIdentificationImages.mockRejectedValue(new Error("Storage unavailable"));
    open("/admin/operations?section=settings");
    fireEvent.click(await screen.findByRole("button", { name: "Check" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.getByRole("button", { name: "Make private" })).toBeDisabled();
  });
});
