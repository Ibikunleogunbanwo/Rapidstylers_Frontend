/**
 * Owner (ADMIN) versus manager (MANAGER) in the admin console: a manager sees
 * only the day-to-day screens, and an owner-only URL opened directly shows a
 * plain "Owner access needed" page instead of a screen that would fail.
 */
import { render, screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { AdminAPI } from "../../hooks/remote/adminApi";
import { setAuthToken, setAdminRole, setUserRole, setAdminLevel, getAdminLevel, isAdminOwner, clearAllSessionTokens } from "../../utils/constant";
import { managerMayOpen, canOpen } from "./adminRole";
import { OwnerOnly } from "./adminAccess";
import { AdminNav } from "./adminShell";
import Dashboard from "./dashboard";
import Operations from "./operations";
import AdminBookings from "./adminBookings";
import BookingsPage from "./bookings";
import AdminLogin from "./adminLogin";
import AdminAccounts from "./adminAccounts";

vi.mock("../../hooks/remote/apiService", () => ({ APIService: {
  adminKpis: vi.fn(), getStylerVerificationQueue: vi.fn(), adminReviewQueue: vi.fn(), adminServiceDisputes: vi.fn(),
  adminUnpaidPayouts: vi.fn(), adminSupportTickets: vi.fn(), adminAuditLogs: vi.fn(), getCommissionSetting: vi.fn(),
  adminStylerConnectStatuses: vi.fn(), adminStylerBusinessSummaries: vi.fn(), adminSignIn: vi.fn(), logout: vi.fn(),
} }));
vi.mock("../../hooks/remote/adminApi", () => ({ AdminAPI: {
  bookings: vi.fn(), revenue: vi.fn(), bookingDetail: vi.fn(), bookingsExport: vi.fn(), reviews: vi.fn(), feedback: vi.fn(),
  accounts: vi.fn(), createAccount: vi.fn(), changeAccountRole: vi.fn(), changeAccountPassword: vi.fn(),
}, saveFile: vi.fn() }));

const reply = data => ({ data: { statusCode: "200", data } });
const signIn = level => { setAuthToken("jwt"); setAdminRole(); setUserRole("ADMIN"); if (level) setAdminLevel(level); };
const at = (path, ui) => render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="*" element={ui} />
  <Route path="/admin/bookings" element={<p>BOOKINGS_PAGE</p>} />
  <Route path="/admin/payments" element={<p>PAYMENTS_PAGE</p>} />
  <Route path="/admin/login" element={<p>LOGIN_PAGE</p>} />
</Routes></MemoryRouter>);

beforeEach(() => {
  sessionStorage.clear();
  vi.resetAllMocks();
  APIService.adminKpis.mockResolvedValue(reply({ customers: 1, openSupportTickets: 2 }));
  APIService.getStylerVerificationQueue.mockResolvedValue(reply([]));
  APIService.adminReviewQueue.mockResolvedValue(reply([]));
  APIService.adminServiceDisputes.mockResolvedValue(reply([]));
  APIService.adminUnpaidPayouts.mockResolvedValue(reply([]));
  APIService.adminSupportTickets.mockResolvedValue(reply([]));
  APIService.adminAuditLogs.mockResolvedValue(reply([]));
  AdminAPI.bookings.mockResolvedValue({ items: [{ appointmentId: "bk-1", status: "COMPLETED", paymentStatus: "CAPTURED", customer: { name: "Ada" }, stylist: {}, service: {} }], totalPages: 1 });
  AdminAPI.revenue.mockResolvedValue(null);
});
afterEach(() => { cleanup(); sessionStorage.clear(); });

describe("which admin URLs a manager may open", () => {
  it("allows the day-to-day screens", () => {
    ["/admin", "/admin/stylers", "/admin/stylers?section=images", "/admin/bookings", "/admin/operations",
      "/admin/operations?section=tickets", "/admin/operations?section=reviews", "/admin/operations?section=feedback"]
      .forEach(to => expect(managerMayOpen(to)).toBe(true));
  });
  it("refuses money, marketing, content, settings, the audit log and accounts", () => {
    ["/admin/payments", "/admin/payments?section=bookings", "/admin/payments?section=disputes", "/admin/recovery",
      "/admin/announcements", "/admin/newsletter", "/admin/content", "/admin/blog", "/admin/categories",
      "/admin/promotions", "/admin/service-areas", "/admin/signup-funnel", "/admin/accounts",
      "/admin/operations?section=logs", "/admin/operations?section=settings", "/admin/operations?section=business",
      "/admin/operations?section=payouts"]
      .forEach(to => expect(managerMayOpen(to)).toBe(false));
  });
  it("lets an owner open everything", () => {
    signIn("ADMIN");
    expect(canOpen("/admin/accounts")).toBe(true);
    setAdminLevel("MANAGER");
    expect(canOpen("/admin/accounts")).toBe(false);
  });
});

describe("the signed-in admin's role", () => {
  it("comes from the sign-in response, then the token, else owner", () => {
    expect(getAdminLevel()).toBe("ADMIN");
    const payload = btoa(JSON.stringify({ sub: "m@x.ca", role: "MANAGER" })).replace(/=+$/, "");
    setAuthToken(`h.${payload}.s`);
    expect(getAdminLevel()).toBe("MANAGER");
    setAdminLevel("ADMIN");
    expect(isAdminOwner()).toBe(true);
    setAdminLevel("manager");
    expect(getAdminLevel()).toBe("MANAGER");
    clearAllSessionTokens();
    expect(getAdminLevel()).toBe("ADMIN");
  });

  it("is saved from the admin sign-in response", async () => {
    APIService.adminSignIn.mockResolvedValue({ data: { token: "jwt", refreshToken: "r", data: { role: "MANAGER" } } });
    render(<MemoryRouter initialEntries={["/admin/login"]}><Routes>
      <Route path="/admin/login" element={<AdminLogin />} /><Route path="/admin" element={<p>DASH</p>} />
    </Routes></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "m@x.ca" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));
    expect(await screen.findByText("DASH")).toBeInTheDocument();
    expect(getAdminLevel()).toBe("MANAGER");
  });
});

describe("admin navigation", () => {
  const links = () => Array.from(screen.getByRole("navigation").querySelectorAll("a")).map(a => [a.textContent, a.getAttribute("href")]);
  it("shows a manager only the screens they can use", () => {
    signIn("MANAGER");
    at("/admin", <AdminNav />);
    expect(links()).toEqual([
      ["Dashboard", "/admin"], ["Stylists", "/admin/stylers"], ["Gallery", "/admin/stylers?section=images"],
      ["Reviews", "/admin/operations?section=reviews"], ["Bookings", "/admin/bookings"], ["Operations", "/admin/operations"],
      ["Support", "/admin/operations?section=tickets"], ["Feedback", "/admin/operations?section=feedback"],
    ]);
    expect(screen.queryByText("Marketing")).not.toBeInTheDocument();
  });
  it("shows an owner every screen, admin accounts included", () => {
    signIn("ADMIN");
    at("/admin", <AdminNav />);
    expect(links()).toContainEqual(["Admin accounts", "/admin/accounts"]);
    expect(links()).toContainEqual(["Bookings", "/admin/payments?section=bookings"]);
    expect(links()).toContainEqual(["Audit log", "/admin/operations?section=logs"]);
  });
});

describe("owner-only pages", () => {
  it("explain themselves to a manager who opens them directly", () => {
    signIn("MANAGER");
    at("/admin/promotions", <OwnerOnly><p>PROMOTIONS</p></OwnerOnly>);
    expect(screen.getByRole("heading", { name: "Owner access needed" })).toBeInTheDocument();
    expect(screen.queryByText("PROMOTIONS")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the dashboard" })).toHaveAttribute("href", "/admin");
  });
  it("open normally for an owner", () => {
    signIn("ADMIN");
    at("/admin/promotions", <OwnerOnly><p>PROMOTIONS</p></OwnerOnly>);
    expect(screen.getByText("PROMOTIONS")).toBeInTheDocument();
  });
  it("send a manager on Payments' bookings tab to the bookings page", () => {
    signIn("MANAGER");
    at("/admin/pay?section=bookings", <OwnerOnly managerTo={p => p.get("section") === "bookings" ? "/admin/bookings" : null}><p>PAY</p></OwnerOnly>);
    expect(screen.getByText("BOOKINGS_PAGE")).toBeInTheDocument();
  });
});

describe("a manager's screens", () => {
  it("dashboard skips the money queues and owner tools", async () => {
    signIn("MANAGER");
    at("/admin", <Dashboard />);
    expect(await screen.findByRole("link", { name: /Open support tickets/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Service disputes/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Unpaid payouts/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View audit log" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Send an announcement" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View bookings" })).toHaveAttribute("href", "/admin/bookings");
    expect(APIService.adminServiceDisputes).not.toHaveBeenCalled();
    expect(APIService.adminUnpaidPayouts).not.toHaveBeenCalled();
  });

  it("operations shows only support, reviews and feedback tabs", async () => {
    signIn("MANAGER");
    at("/admin/operations", <Operations />);
    const tabs = within(await screen.findByRole("navigation", { name: "Operations sections" })).getAllByRole("button").map(b => b.textContent);
    expect(tabs).toEqual(["Overview", "Support", "Reviews", "Feedback"]);
  });

  it("an owner-only operations section is not loaded for a manager", () => {
    signIn("MANAGER");
    at("/admin/operations?section=logs", <Operations />);
    expect(screen.getByRole("heading", { name: "Owner access needed" })).toBeInTheDocument();
    expect(APIService.adminAuditLogs).not.toHaveBeenCalled();
  });

  it("bookings are read-only: no export, refund or revenue", async () => {
    signIn("MANAGER");
    at("/admin/x", <AdminBookings onRefund={vi.fn()} />);
    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refund" })).not.toBeInTheDocument();
    expect(AdminAPI.revenue).not.toHaveBeenCalled();
  });

  it("bookings and their detail show no amounts to a manager", async () => {
    signIn("MANAGER");
    // What the server sends a manager: no money keys at all.
    AdminAPI.bookings.mockResolvedValue({ items: [{ appointmentId: "bk-1", status: "COMPLETED", paymentStatus: "CAPTURED", customer: { name: "Ada" }, stylist: {}, service: {} }], totals: { count: 1, byStatus: {} }, totalPages: 1 });
    AdminAPI.bookingDetail.mockResolvedValue({ appointmentId: "bk-1", status: "COMPLETED", paymentStatus: "CAPTURED", serviceAddress: "1 Main St", createdAt: "2026-10-01T10:00:00" });
    at("/admin/x", <AdminBookings />);
    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("1 Main St")).toBeInTheDocument();
    ["Price / travel fee", "Platform fee / stylist share", "Refunded", "Payment intent", "Stylist payout"]
      .forEach(label => expect(screen.queryByText(label)).not.toBeInTheDocument());
    expect(screen.getByText("Payment status", { selector: "dt" })).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("an owner still sees the booking's money in its detail", async () => {
    signIn("ADMIN");
    AdminAPI.bookingDetail.mockResolvedValue({ appointmentId: "bk-1", price: "80.00", travelFee: "0", platformFee: "12.00", stylistShare: "68.00", refundedTotal: "0", paymentIntentId: "pi_1", createdAt: "2026-10-01T10:00:00" });
    at("/admin/x", <AdminBookings onRefund={vi.fn()} />);
    await screen.findByText("Ada");
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(await screen.findByText("Price / travel fee")).toBeInTheDocument();
    expect(screen.getByText("pi_1")).toBeInTheDocument();
  });

  it("an owner keeps export, refund and revenue", async () => {
    signIn("ADMIN");
    at("/admin/x", <AdminBookings onRefund={vi.fn()} />);
    expect(await screen.findByText("Ada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export CSV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refund" })).toBeInTheDocument();
    expect(AdminAPI.revenue).toHaveBeenCalled();
  });

  it("the bookings page is the manager's; an owner goes to Payments", async () => {
    signIn("MANAGER");
    render(<MemoryRouter initialEntries={["/admin/bookings"]}><Routes><Route path="/admin/bookings" element={<BookingsPage />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Bookings" })).toBeInTheDocument();
    cleanup();
    setAdminLevel("ADMIN");
    render(<MemoryRouter initialEntries={["/admin/bookings"]}><Routes>
      <Route path="/admin/bookings" element={<BookingsPage />} /><Route path="/admin/payments" element={<p>PAYMENTS_PAGE</p>} />
    </Routes></MemoryRouter>);
    expect(screen.getByText("PAYMENTS_PAGE")).toBeInTheDocument();
  });
});

describe("admin accounts screen", () => {
  const accounts = [
    { id: 1, email: "owner@x.ca", role: "ADMIN", enabled: true, createdAt: "2026-10-01T10:00:00" },
    { id: 2, email: "desk@x.ca", role: "MANAGER", enabled: true, createdAt: "2026-10-02T10:00:00" },
  ];
  beforeEach(() => { signIn("ADMIN"); AdminAPI.accounts.mockResolvedValue(accounts); });

  it("lists each account's role", async () => {
    at("/admin/accounts", <AdminAccounts />);
    const ownerRow = (await screen.findByText("owner@x.ca")).closest("tr");
    expect(ownerRow).toHaveTextContent("Owner");
    expect(screen.getByText("desk@x.ca").closest("tr")).toHaveTextContent("Manager");
  });

  it("creates a manager with the role picker, confirmed by the owner's password", async () => {
    AdminAPI.createAccount.mockResolvedValue({ id: 3, role: "MANAGER" });
    at("/admin/accounts", <AdminAccounts />);
    await screen.findByText("owner@x.ca");
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " new@x.ca " } });
    fireEvent.change(screen.getByLabelText("Password for the new account"), { target: { value: "Str0ng-Passw0rd!" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "MANAGER" } });
    expect(screen.getByText(/Stylist verification, gallery and review moderation/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your admin password (to confirm changes)"), { target: { value: "owner-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(AdminAPI.createAccount).toHaveBeenCalledWith({ email: "new@x.ca", password: "Str0ng-Passw0rd!", role: "MANAGER" }, "owner-pass"));
    expect(screen.getByLabelText("Your admin password (to confirm changes)")).toHaveValue("");
  });

  it("changes a role, and asks for the password first", async () => {
    AdminAPI.changeAccountRole.mockResolvedValue({ id: 2, role: "ADMIN" });
    at("/admin/accounts", <AdminAccounts />);
    await screen.findByText("desk@x.ca");
    const save = screen.getByRole("button", { name: "Save role for desk@x.ca" });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Role for desk@x.ca"), { target: { value: "ADMIN" } });
    fireEvent.click(save);
    expect(screen.getByRole("alert")).toHaveTextContent(/password/);
    expect(AdminAPI.changeAccountRole).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Your admin password (to confirm changes)"), { target: { value: "owner-pass" } });
    fireEvent.click(save);
    await waitFor(() => expect(AdminAPI.changeAccountRole).toHaveBeenCalledWith(2, "ADMIN", "owner-pass"));
  });

  it("sets a new password for an account, confirmed by the owner's password", async () => {
    AdminAPI.changeAccountPassword.mockResolvedValue({ id: 1, role: "ADMIN" });
    at("/admin/accounts", <AdminAccounts />);
    await screen.findByText("owner@x.ca");
    fireEvent.click(screen.getByRole("button", { name: "Change password for owner@x.ca" }));
    const field = screen.getByLabelText("New password for owner@x.ca");
    const set = screen.getByRole("button", { name: "Set password" });
    fireEvent.change(field, { target: { value: "short" } });
    expect(set).toBeDisabled();
    fireEvent.change(field, { target: { value: "N3w-Str0ng-Passw0rd" } });
    fireEvent.click(set);
    expect(screen.getByRole("alert")).toHaveTextContent(/password/);
    expect(AdminAPI.changeAccountPassword).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Your admin password (to confirm changes)"), { target: { value: "owner-pass" } });
    fireEvent.click(set);
    await waitFor(() => expect(AdminAPI.changeAccountPassword).toHaveBeenCalledWith(1, "N3w-Str0ng-Passw0rd", "owner-pass"));
    await waitFor(() => expect(screen.queryByLabelText("New password for owner@x.ca")).not.toBeInTheDocument());
  });

  it("shows the server's refusal", async () => {
    AdminAPI.changeAccountRole.mockRejectedValue(new Error("At least one enabled owner must remain."));
    at("/admin/accounts", <AdminAccounts />);
    await screen.findByText("owner@x.ca");
    fireEvent.change(screen.getByLabelText("Role for owner@x.ca"), { target: { value: "MANAGER" } });
    fireEvent.change(screen.getByLabelText("Your admin password (to confirm changes)"), { target: { value: "owner-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Save role for owner@x.ca" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("At least one enabled owner must remain.");
  });
});
