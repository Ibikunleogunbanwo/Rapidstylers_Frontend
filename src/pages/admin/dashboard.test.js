import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { APIService } from "../../hooks/remote/apiService";
import { setAuthToken, setUserRole, setAdminRole } from "../../utils/constant";
import Dashboard from "./dashboard";
vi.mock("../../hooks/remote/apiService", () => ({APIService:{adminKpis:vi.fn(), getStylerVerificationQueue:vi.fn(), adminReviewQueue:vi.fn(), adminServiceDisputes:vi.fn(), adminUnpaidPayouts:vi.fn()}}));
const reply = data => ({data:{statusCode:"200", data}});
const mount = () => render(<MemoryRouter initialEntries={["/admin"]}><Routes><Route path="/admin" element={<Dashboard/>}/><Route path="/admin/login" element={<h1>Sign in</h1>}/></Routes></MemoryRouter>);
beforeEach(() => {
  sessionStorage.clear(); vi.clearAllMocks(); setAuthToken("admin-test"); setUserRole("ADMIN"); setAdminRole();
  APIService.adminKpis.mockResolvedValue(reply({customers:20, stylists:4, approvedStylists:2, appointments:12, pendingAppointments:3, completedAppointments:8, openSupportTickets:1}));
  APIService.getStylerVerificationQueue.mockResolvedValue(reply([{verificationStatus:"PENDING"}, {verificationStatus:"APPROVED"}]));
  APIService.adminReviewQueue.mockResolvedValue(reply([]));
  APIService.adminServiceDisputes.mockResolvedValue(reply([]));
  APIService.adminUnpaidPayouts.mockResolvedValue(reply([]));
});
afterEach(() => sessionStorage.clear());
test("loads real totals and links to actionable queues", async () => {
  mount(); expect(await screen.findByText("20")).toBeInTheDocument();
  const link = screen.getByRole("link", {name:"Professional applications 1"});
  expect(link).toHaveAttribute("href", "/admin/stylers");
  expect(screen.getByRole("link", {name:"Service disputes 0"})).toHaveAttribute("href", "/admin/payments?section=disputes");
});
test("one failed queue stays unavailable while other reads succeed and refresh recovers", async () => {
  APIService.adminReviewQueue.mockRejectedValueOnce(new Error("offline")); mount();
  expect(await screen.findByRole("alert")).toHaveTextContent("could not be loaded");
  expect(screen.getByRole("link", {name:"Reviews awaiting moderation Unavailable"})).toBeInTheDocument();
  expect(screen.getByText("20")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {name:"Refresh"}));
  await waitFor(() => expect(screen.getByRole("link", {name:"Reviews awaiting moderation 0"})).toBeInTheDocument());
});
test("signed out users never request admin data", () => {
  sessionStorage.clear(); mount(); expect(screen.getByRole("heading", {name:"Sign in"})).toBeInTheDocument();
  expect(APIService.adminKpis).not.toHaveBeenCalled();
});
