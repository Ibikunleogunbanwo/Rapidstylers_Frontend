import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StylerNotifications from "./stylerNotifications";
import { APIService } from "../../hooks/remote/apiService";
import { notificationTime, formatNotificationTime } from "../users/pages/notifications";

vi.mock("../../hooks/remote/apiService", () => ({ APIService: {
  stylerNotifications: vi.fn(), stylerMarkNotificationRead: vi.fn(), stylerMarkAllNotificationsRead: vi.fn(),
  stylerDeleteNotification: vi.fn(), stylerDeleteAllNotifications: vi.fn(),
  listNotifications: vi.fn(), markNotificationRead: vi.fn(), markAllNotificationsRead: vi.fn(), deleteNotification: vi.fn(), deleteAllNotifications: vi.fn(),
} }));
vi.mock("../../utils/constant", async (importOriginal) => ({ ...(await importOriginal()), getAuthToken: vi.fn(() => "jwt"), showErrorToastMessage: vi.fn() }));

const ITEMS = [
  { id: "N1", type: "ANNOUNCEMENT", title: "New payout dates", message: "Payouts now go out on Fridays.", read: false, createdAt: "2026-10-11 21:12:25", createdAtUtc: "2026-10-12T03:12:25Z" },
  { id: "N2", type: "BOOKING", title: "New booking", message: "Ada booked Braids.", read: true, createdAt: "2026-10-10 09:00:00", createdAtUtc: null },
];
const mount = () => render(<MemoryRouter><StylerNotifications /></MemoryRouter>);
const ok = { data: { statusCode: "200", data: {} } };

beforeEach(() => {
  vi.clearAllMocks();
  APIService.stylerNotifications.mockResolvedValue({ data: { data: { items: ITEMS, unreadCount: 1 } } });
  [APIService.stylerMarkNotificationRead, APIService.stylerMarkAllNotificationsRead, APIService.stylerDeleteNotification, APIService.stylerDeleteAllNotifications].forEach(fn => fn.mockResolvedValue(ok));
});

it("lists the stylist's own notifications from /styler/notifications, never the customer inbox", async () => {
  mount();
  expect(await screen.findByText("New payout dates")).toBeInTheDocument();
  expect(screen.getByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
  expect(screen.getByText("Ada booked Braids.")).toBeInTheDocument();
  expect(screen.getAllByLabelText("Unread")).toHaveLength(1);
  expect(APIService.listNotifications).not.toHaveBeenCalled();
});

it("marks one read, then all read", async () => {
  APIService.stylerNotifications.mockResolvedValue({ data: { data: { items: [ITEMS[0], { ...ITEMS[1], id: "N3", read: false }], unreadCount: 2 } } });
  mount();
  fireEvent.click(await screen.findByText("New payout dates"));
  await waitFor(() => expect(APIService.stylerMarkNotificationRead).toHaveBeenCalledWith("N1"));
  await waitFor(() => expect(screen.getAllByLabelText("Unread")).toHaveLength(1));
  fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
  await waitFor(() => expect(APIService.stylerMarkAllNotificationsRead).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.queryByLabelText("Unread")).not.toBeInTheDocument());
  expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
});

it("deletes one with a labelled control, and clears all after confirming, ending on the empty state", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
  mount();
  await screen.findByText("New payout dates");
  const first = screen.getByText("New payout dates").closest("div.relative");
  fireEvent.click(within(first).getByRole("button", { name: "Delete this notification" }));
  await waitFor(() => expect(screen.queryByText("New payout dates")).not.toBeInTheDocument());
  expect(APIService.stylerDeleteNotification).toHaveBeenCalledWith("N1");
  fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
  expect(confirm).toHaveBeenCalled();
  expect(await screen.findByText("You have no notifications yet.")).toBeInTheDocument();
  expect(APIService.stylerDeleteAllNotifications).toHaveBeenCalledTimes(1);
  confirm.mockRestore();
});

it("shows the empty state when there is nothing", async () => {
  APIService.stylerNotifications.mockResolvedValue({ data: { data: { items: [], unreadCount: 0 } } });
  mount();
  expect(await screen.findByText("You have no notifications yet.")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Clear all" })).not.toBeInTheDocument();
});

it("shows times from createdAtUtc in the viewer's zone, falling back to createdAt", async () => {
  mount();
  const instant = new Date("2026-10-12T03:12:25Z");
  const expected = notificationTime(ITEMS[0]);
  expect(expected).toBe(`${instant.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${instant.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
  const utcTime = await screen.findByText(expected);
  expect(utcTime.tagName).toBe("TIME");
  expect(utcTime).toHaveAttribute("datetime", "2026-10-12T03:12:25Z");
  expect(screen.getByText("Oct 10, 9:00 AM")).toHaveAttribute("datetime", "2026-10-10T09:00:00");
});

describe("notificationTime (C-08)", () => {
  const now = new Date(2026, 9, 12);
  it("reads createdAtUtc as an instant and shows it in local time", () => {
    const instant = new Date("2025-01-02T15:05:00Z");
    expect(notificationTime({ createdAtUtc: "2025-01-02T15:05:00Z", createdAt: "2025-01-02 08:05:00" }, now))
      .toBe(`${instant.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${instant.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
  });
  it("falls back to createdAt when createdAtUtc is missing, null or not a zoned instant", () => {
    for (const createdAtUtc of [undefined, null, "", "2026-10-11 21:12:25", "garbage"]) {
      expect(notificationTime({ createdAtUtc, createdAt: "2026-10-11 21:12:25" }, now)).toBe(formatNotificationTime("2026-10-11 21:12:25", now));
    }
    expect(notificationTime({ createdAt: "2026-10-11 21:12:25" }, now)).toBe("Oct 11, 9:12 PM");
  });
});
